// The game itself, with no DOM: the player, H.E.R.B.I.E., progress and missions.
// The browser draws it and asks the player through `UI`; the smoke bot answers instead.

import { agentById, agents, type AgentId } from '../../../data/agents.ts';
import type { VitrinaId } from '../../../data/archive.ts';
import { roles, type Role } from '../../../data/experience.ts';
import { conceptById, type Concept } from '../../../data/harness.ts';
import { doors, missionById, starsFor, tokenComment, type Line, type MissionId, type MissionInfo } from '../../../data/missions.ts';
import { scripts } from '../missions/index.ts';
import type { Pose } from '../sprites/body.ts';
import { World, type Interactable, type Point, type Target } from '../world/map.ts';
import { Walker, findPath, nearestWalkable } from '../world/walker.ts';
import { fresh, isOpen, nextMission, restore, type SaveData, type Store } from './state.ts';

export interface AssignTask {
  title: string;
  prompt: string;
  cards: { id: string; text: string }[];
  targets: AgentId[];
  /** Hand a card to an agent. Costs tokens; says whether it was right and what the agent replies. */
  pick(card: string, agent: AgentId): { ok: boolean; line: Line };
}

export interface RewardView {
  mission: MissionInfo;
  stars: 1 | 2 | 3;
  tokens: number;
  concepts: Concept[];
  role: Role;
  point: string;
  lead: string;
  /** The display case this mission uncovered, if it was still covered. */
  uncovered: VitrinaId | null;
}

export interface UI {
  /** The player is on a touch screen, so lines talk about taps instead of keys. */
  readonly touch: boolean;
  say(lines: Line[]): Promise<void>;
  assign(task: AssignTask): Promise<void>;
  /** Resolves with 'archive' if the player wants to see the uncovered case right away. */
  reward(view: RewardView): Promise<'archive' | 'close'>;
  vitrina(id: VitrinaId): Promise<void>;
  toast(text: string): void;
  /** Progress or the objective changed. */
  refresh(): void;
}

export interface MissionScript {
  id: MissionId;
  objective(g: Game): string;
  /** Runs when the mission starts or the player comes back to it. */
  start(g: Game, resumed: boolean): Promise<void>;
  /** Handle talking to an agent; false lets them say their usual line. */
  talk(g: Game, agent: AgentId): Promise<boolean>;
}

export interface Input {
  dx: number;
  dy: number;
}

export class Game {
  readonly world = new World();
  readonly player: Walker;
  readonly herbie: Point;
  readonly ui: UI;
  state: SaveData;
  /** Seconds since the game was created. */
  time = 0;
  /** Play has been pressed. */
  playing = false;
  /** A dialog or panel is open; the player can't move. */
  busy = false;
  /** Where a tap asked to go, for the marker. */
  dest: Point | null = null;
  /** Agents doing something special (waving, cheering) until a given time. */
  readonly moods = new Map<AgentId, { pose: Pose; since: number; until: number }>();
  private goal: Interactable | null = null;
  /** Somewhere to walk once the current scripted moment ends. */
  private next: Interactable | null = null;
  private mission: MissionScript | null = null;
  private store: Store;

  constructor(ui: UI, store: Store) {
    this.ui = ui;
    this.store = store;
    this.state = restore(store.load());
    this.player = new Walker(this.world.spawn);
    this.herbie = { ...this.world.herbieSpawn };
  }

  /** Start playing: pick up the current mission, or the next one. */
  async begin(): Promise<void> {
    this.playing = true;
    const next = nextMission(this.state);
    const resumed = this.state.started && this.state.active?.id === next?.id;
    this.state.started = true;
    if (next) {
      this.state.active = resumed && this.state.active ? this.state.active : { id: next.id, tokens: 0 };
      this.mission = scripts[next.id] ?? null;
    }
    this.save();
    this.ui.refresh();
    if (this.mission) await this.run(() => this.mission!.start(this, resumed));
    this.ui.refresh();
  }

  objective(): string {
    if (this.mission) return this.mission.objective(this);
    return 'Explore the office · more missions coming soon';
  }

  // ---------- frame ----------

  update(dt: number, input: Input): void {
    this.time += dt;
    if (this.playing && !this.busy && this.next) {
      const next = this.next;
      this.next = null;
      this.goTo(next);
    }
    if (this.playing && !this.busy) {
      if (input.dx || input.dy) {
        this.goal = null;
        this.dest = null;
        this.player.steer(dt, input.dx, input.dy, this.world);
      } else {
        this.player.follow(dt);
        if (!this.player.path.length) this.dest = null;
      }
      if (this.goal && !this.player.path.length) {
        const goal = this.goal;
        this.goal = null;
        if (this.inRange(goal)) void this.interact(goal);
      }
    } else {
      this.player.moving = false;
    }
    this.follow(dt);
  }

  /** H.E.R.B.I.E. floats at the player's shoulder, a little behind, never on top of them. */
  private follow(dt: number): void {
    if (!this.playing) return;
    const [bx, by, side] = { down: [0, -6, 24], up: [0, 6, 24], left: [16, -4, 0], right: [-16, -4, 0] }[this.player.facing];
    const tx = this.player.x + bx + side;
    const ty = this.player.y + by;
    const k = 1 - Math.exp(-dt * 3);
    this.herbie.x += (tx - this.herbie.x) * k;
    this.herbie.y += (ty - this.herbie.y) * k;
  }

  // ---------- moving and interacting ----------

  /** Everything the player can interact with right now, H.E.R.B.I.E. included once playing. */
  interactables(): Interactable[] {
    if (!this.playing) return this.world.spots;
    const h = this.herbie;
    const herbie: Interactable = {
      target: { kind: 'agent', agent: 'herbie' },
      spot: { x: h.x, y: h.y },
      tile: this.world.tileAt(h),
      face: this.player.x < h.x ? 'right' : 'left',
      reach: { x: 28, y: 18 },
      box: { x: h.x - 12, y: h.y - 46, w: 24, h: 42 },
    };
    return [...this.world.spots, herbie];
  }

  inRange(t: Interactable): boolean {
    return Math.abs(this.player.x - t.spot.x) <= t.reach.x && Math.abs(this.player.y - t.spot.y) <= t.reach.y;
  }

  /**
   * The closest thing within reach, if any. H.E.R.B.I.E. is always at hand, so he only
   * talks when tapped; otherwise an extra key press after a dialog would start another.
   */
  nearest(): Interactable | null {
    if (!this.playing || this.busy) return null;
    const dist = (t: Interactable) => Math.hypot(this.player.x - t.spot.x, this.player.y - t.spot.y);
    const near = this.world.spots.filter((t) => this.inRange(t)).sort((a, b) => dist(a) - dist(b));
    return near[0] ?? null;
  }

  find(target: Target): Interactable | undefined {
    return this.interactables().find((s) => JSON.stringify(s.target) === JSON.stringify(target));
  }

  /** Walk to a point on the map. Returns false if there's no way there. */
  walkTo(p: Point, goal: Interactable | null = null, exact?: Point): boolean {
    if (!this.playing || this.busy) return false;
    const to = nearestWalkable(this.world, this.world.tileAt(p));
    const path = to && findPath(this.world, this.world.tileAt(this.player), to);
    if (!to || !path) return false;
    const points = path.map((t) => this.world.centre(t));
    if (exact) points.push(exact);
    else if (!points.length) points.push(this.world.centre(to));
    this.player.path = points;
    this.goal = goal;
    this.dest = exact ?? this.world.centre(to);
    return true;
  }

  /** Walk somewhere as soon as the current dialog or panel closes. */
  after(t: Interactable): void {
    this.next = t;
  }

  /** Walk up to something and interact with it on arrival. */
  goTo(t: Interactable): boolean {
    if (this.inRange(t)) {
      void this.interact(t);
      return true;
    }
    if (t.target.kind === 'agent' && t.target.agent === 'herbie') return this.walkTo(t.spot, t);
    return this.walkTo(this.world.centre(t.tile), t, t.spot);
  }

  async interact(t: Interactable): Promise<void> {
    if (!this.playing || this.busy) return;
    this.player.path = [];
    this.goal = null;
    this.dest = null;
    this.player.facing = t.face;
    const target = t.target;
    await this.run(async () => {
      if (target.kind === 'agent') {
        this.mood(target.agent, 'wave', 1.6);
        const handled = this.mission ? await this.mission.talk(this, target.agent) : false;
        if (!handled) await this.ui.say([{ who: target.agent, text: agentById[target.agent].idle }]);
      } else if (target.kind === 'vitrina') {
        await this.ui.vitrina(target.id);
      } else {
        await this.ui.say(doors[target.id]);
      }
    });
  }

  /** Run a scripted moment: the player stands still until it ends. Nested calls just run. */
  async run(fn: () => Promise<void>): Promise<void> {
    if (this.busy) return fn();
    this.busy = true;
    this.player.moving = false;
    try {
      await fn();
    } finally {
      this.busy = false;
      this.ui.refresh();
    }
  }

  // ---------- helpers for missions ----------

  say(lines: Line[]): Promise<void> {
    return this.ui.say(lines);
  }

  mood(agent: AgentId, pose: Pose, seconds: number): void {
    this.moods.set(agent, { pose, since: this.time, until: this.time + seconds });
  }

  /** Spend tokens on the mission in progress. */
  spend(tokens: number): void {
    if (!this.state.active) return;
    this.state.active.tokens += tokens;
    this.save();
    this.ui.refresh();
  }

  addCard(agent: AgentId): void {
    if (this.state.agentdex.includes(agent)) return;
    this.state.agentdex.push(agent);
    this.save();
    this.ui.toast(`Card added: ${agentById[agent].name} · ${this.state.agentdex.length}/${agents.length}`);
    this.ui.refresh();
  }

  /** Close the mission in progress: stars, J.A.R.V.I.S. on the bill, then the reward. */
  async complete(id: MissionId): Promise<'archive' | 'close'> {
    const info = missionById[id];
    const tokens = this.state.active?.tokens ?? 0;
    const stars = starsFor(tokens, info.budget);
    const wasOpen = this.isCaseOpen(info.realLife.role);
    this.state.done[id] = { stars, tokens };
    this.state.active = null;
    this.mission = null;
    this.save();
    this.ui.refresh();
    const text = tokenComment[stars].replace('{tokens}', tokens.toLocaleString('en-US'));
    await this.say([{ who: 'jarvis', text, mood: stars === 3 ? 'happy' : stars === 1 ? 'serious' : 'talk' }]);
    const role = roles.find((r) => r.id === info.realLife.role)!;
    return this.ui.reward({
      mission: info,
      stars,
      tokens,
      concepts: info.concepts.map((c) => conceptById[c]),
      role,
      point: role.points[info.realLife.point],
      lead: info.realLife.lead,
      uncovered: wasOpen ? null : role.id,
    });
  }

  isCaseOpen(id: VitrinaId): boolean {
    return isOpen(this.state, id);
  }

  uncoverAll(): void {
    this.state.uncoverAll = true;
    this.save();
    this.ui.refresh();
  }

  /** Forget all progress and start over from the lobby. */
  reset(): void {
    this.store.clear();
    this.state = fresh();
    this.mission = null;
    this.goal = null;
    this.next = null;
    this.dest = null;
    this.playing = false;
    this.busy = false;
    this.player.x = this.world.spawn.x;
    this.player.y = this.world.spawn.y;
    this.player.path = [];
    this.player.facing = 'down';
    this.herbie.x = this.world.herbieSpawn.x;
    this.herbie.y = this.world.herbieSpawn.y;
    this.ui.refresh();
  }

  save(): void {
    this.store.save(this.state);
  }
}
