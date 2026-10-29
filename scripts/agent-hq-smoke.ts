// Smoke bot for Agent HQ: checks the map and the data, renders every sprite frame and
// plays mission 1 end to end without a browser. Run with `pnpm test`.

import { agents, type AgentId } from '../src/data/agents.ts';
import { vitrinas } from '../src/data/archive.ts';
import { roles } from '../src/data/experience.ts';
import { firstDay, missions } from '../src/data/missions.ts';
import { Game, type AssignTask, type UI } from '../src/scripts/agent-hq/core/game.ts';
import { DRUMS, STEPS_PER_BAR, card, fanfare, freq, office, parse, type Song } from '../src/scripts/agent-hq/audio/songs.ts';
import { isOpen, type SaveData, type Store } from '../src/scripts/agent-hq/core/state.ts';
import { POSES, type Pose } from '../src/scripts/agent-hq/sprites/body.ts';
import { renderCharacter, type CharacterId } from '../src/scripts/agent-hq/sprites/cast.ts';
import { renderProp } from '../src/scripts/agent-hq/sprites/props.ts';
import { MAP_ROWS, World } from '../src/scripts/agent-hq/world/map.ts';
import { findPath } from '../src/scripts/agent-hq/world/walker.ts';

let failures = 0;
function check(ok: unknown, what: string): void {
  if (ok) return;
  failures++;
  console.error(`✗ ${what}`);
}

// ---------- data ----------
for (const m of missions) {
  const role = roles.find((r) => r.id === m.realLife.role);
  check(role?.points[m.realLife.point], `mission ${m.id} points at a real achievement`);
}
for (const v of vitrinas) check(v.id === 'education' || roles.some((r) => r.id === v.id), `display case ${v.id} has a role`);
check(roles.every((r) => vitrinas.some((v) => v.id === r.id)), 'every role has a display case');
for (const id of Object.keys(firstDay.meet)) check(agents.some((a) => a.id === id), `first-day line for ${id}`);
for (const c of firstDay.quiz.cards) check(agents.some((a) => a.id === c.answer), `quiz answer ${c.answer} is an agent`);
check(!/key|WASD|press|space|click/i.test(firstDay.controls.touch.text), 'the touch controls mention no keys or clicks');

// ---------- map ----------
const world = new World();
check(MAP_ROWS.every((r) => r.length === world.w), 'map rows are the same width');
const spawn = world.tileAt(world.spawn);
check(!world.solid(spawn.tx, spawn.ty), 'spawn is walkable');
for (const s of world.spots) {
  check(findPath(world, spawn, s.tile) !== null, `${JSON.stringify(s.target)} is reachable from the lobby`);
}

// ---------- sprites ----------
const ids: CharacterId[] = [...agents.map((a) => a.id), 'operator'];
let frames = 0;
for (const id of ids) {
  for (const pose of Object.keys(POSES) as Pose[]) {
    for (let f = 0; f < POSES[pose].length; f++) {
      for (const facing of id === 'operator' ? (['down', 'up', 'side'] as const) : (['down'] as const)) {
        const g = renderCharacter(id, pose, f, f % 2 === 1, facing);
        check(g.px.length === 45 && g.px.every((r) => r.length === 32), `${id} ${pose} ${facing} ${f} is 32x45`);
        frames++;
      }
    }
  }
}
for (const p of world.props) check(renderProp(p, { open: true }).px.length > 0, `prop ${p.kind} renders`);

// ---------- music ----------
const songs: Record<string, Song> = { office, card, fanfare };
let notes = 0;
for (const [name, song] of Object.entries(songs)) {
  const lengths = new Set(Object.values(song.bars).map((bars) => bars.length));
  check(lengths.size === 1, `${name}: every channel has the same number of bars`);
  for (const [channel, bars] of Object.entries(song.bars)) {
    bars.forEach((bar, i) => check(bar.trim().split(/\s+/).length === STEPS_PER_BAR, `${name} ${channel} bar ${i + 1} has ${STEPS_PER_BAR} steps`));
    check(!bars[0].trim().startsWith('-'), `${name} ${channel} doesn't start on a hold`);
    for (const n of parse(bars)) {
      const ok = channel === 'drums' ? DRUMS.includes(n.note) : freq(n.note) > 20 && freq(n.note) < 5000;
      check(ok, `${name} ${channel}: "${n.note}" at step ${n.step} is a ${channel === 'drums' ? 'drum' : 'note'}`);
      notes++;
    }
  }
}
check(Math.abs(freq('A4') - 440) < 1e-9 && Math.abs(freq('C4') - 261.63) < 0.01 && Math.abs(freq('Bb2') - 116.54) < 0.01, 'note names give the right pitch');

// ---------- mission 1 ----------
class MemoryStore implements Store {
  data: unknown = null;
  load() {
    return this.data ? JSON.parse(JSON.stringify(this.data)) : null;
  }
  save(d: SaveData) {
    this.data = JSON.parse(JSON.stringify(d));
  }
  clear() {
    this.data = null;
  }
}

class BotUI implements UI {
  touch = false;
  lines = 0;
  wrongFirst: boolean;
  rewards: string[] = [];
  constructor(wrongFirst: boolean) {
    this.wrongFirst = wrongFirst;
  }
  async say(lines: { who: AgentId; text: string }[]) {
    this.lines += lines.length;
  }
  async assign(task: AssignTask) {
    const quiz = firstDay.quiz.cards;
    for (const card of task.cards) {
      const answer = quiz.find((c) => c.id === card.id)!.answer;
      if (this.wrongFirst && card.id === task.cards[0].id) check(!task.pick(card.id, 'dume').ok, 'a wrong pick is rejected');
      check(task.pick(card.id, answer).ok, `${card.id} goes to ${answer}`);
    }
  }
  async reward(view: Parameters<UI['reward']>[0]) {
    this.rewards.push(`${view.mission.id}:${view.stars}`);
    return 'archive' as const;
  }
  async vitrina() {}
  toast() {}
  refresh() {}
}

const tick = () => new Promise((r) => setTimeout(r, 0));

async function playFirstDay(wrongFirst: boolean): Promise<{ game: Game; ui: BotUI; store: MemoryStore }> {
  const ui = new BotUI(wrongFirst);
  const store = new MemoryStore();
  const game = new Game(ui, store);
  await game.begin();
  for (const id of agents.map((a) => a.id).filter((id) => id !== 'herbie')) {
    const spot = game.find({ kind: 'agent', agent: id })!;
    check(game.goTo(spot), `can walk to ${id}`);
    for (let i = 0; i < 2000 && (game.player.path.length || game.busy); i++) {
      game.update(1 / 60, { dx: 0, dy: 0 });
      await tick();
    }
    for (let i = 0; i < 20 && game.busy; i++) await tick();
    check(game.state.agentdex.includes(id), `met ${id}`);
  }
  return { game, ui, store };
}

const clean = await playFirstDay(false);
check(clean.game.state.agentdex.length === agents.length, 'the Agentdex is full');
check(clean.game.state.done.m1?.stars === 3, `a clean run earns three stars (got ${clean.game.state.done.m1?.stars})`);
check(clean.game.state.done.m1?.tokens === 300, `a clean run spends 300 tokens (got ${clean.game.state.done.m1?.tokens})`);
check(isOpen(clean.game.state, 'nutrilieve'), 'mission 1 uncovers the Nutrilieve case');
check(!isOpen(clean.game.state, 'mango'), 'the Mango case stays covered');
check(clean.game.objective().startsWith('Explore'), 'after mission 1 the objective is to explore');

// asked to see the case: the operator walks to it once the dialog closes
for (let i = 0; i < 2000 && !clean.game.inRange(clean.game.find({ kind: 'vitrina', id: 'nutrilieve' })!); i++) {
  clean.game.update(1 / 60, { dx: 0, dy: 0 });
  await tick();
}
check(clean.game.inRange(clean.game.find({ kind: 'vitrina', id: 'nutrilieve' })!), 'the operator walks to the uncovered case');

const sloppy = await playFirstDay(true);
check(sloppy.game.state.done.m1?.stars === 2, `one wrong pick drops to two stars (got ${sloppy.game.state.done.m1?.stars})`);

// progress survives a reload
const reloaded = new Game(new BotUI(false), clean.store);
check(reloaded.state.done.m1?.stars === 3 && reloaded.state.agentdex.length === agents.length, 'progress survives a reload');

// keyboard: walking into a wall stops at the wall
const walker = new Game(new BotUI(false), new MemoryStore());
await walker.begin();
for (let i = 0; i < 300; i++) walker.update(1 / 60, { dx: 0, dy: 1 });
check(walker.player.y < 20 * 16, 'the lobby wall stops the operator');

if (failures) throw new Error(`${failures} check(s) failed`);
console.log(`✓ Agent HQ smoke: ${frames} sprite frames, ${world.spots.length} spots reachable, ${notes} notes of music, mission 1 played (${clean.ui.lines} lines)`);
