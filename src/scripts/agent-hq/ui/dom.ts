// The browser's side of `UI`: dialog box, modal card, HUD, toasts and the action button.

import { agentById, agents } from '../../../data/agents.ts';
import { vitrinaLabel, type VitrinaId } from '../../../data/archive.ts';
import { missionById, type Line } from '../../../data/missions.ts';
import { sound } from '../audio/sound.ts';
import type { AssignTask, Game, RewardView, UI } from '../core/game.ts';
import { level } from '../core/state.ts';
import type { Interactable } from '../world/map.ts';
import { Dialog } from './dialog.ts';
import { assignPanel, dexPanel, gotoPanel, menuPanel, rewardPanel, vitrinaPanel } from './panels.ts';
import { Sheet } from './sheet.ts';

export type Panel = 'goto' | 'dex' | 'menu';

const $ = <T extends HTMLElement>(root: ParentNode, sel: string) => root.querySelector<T>(sel)!;

/** What the action button says for each kind of thing. */
export function actionLabel(t: Interactable): string {
  const tg = t.target;
  if (tg.kind === 'agent') return `Talk to ${agentById[tg.agent].name}`;
  if (tg.kind === 'vitrina') return `Look at ${vitrinaLabel(tg.id)}`;
  return tg.id === 'study' ? 'Try the door' : 'Exit';
}

export class DomUI implements UI {
  readonly dialog: Dialog;
  readonly sheet: Sheet;
  private root: HTMLElement;
  private stage: HTMLElement;
  private game!: Game;
  private toastTimer = 0;
  private shownAction = '';
  private shownObjective = '';

  constructor(root: HTMLElement, stage: HTMLElement, reduce: boolean) {
    this.root = root;
    this.stage = stage;
    this.dialog = new Dialog($(root, '#hq-dialog'), reduce);
    this.sheet = new Sheet($(root, '#hq-sheet'));
  }

  bind(game: Game): void {
    this.game = game;
    this.root.querySelectorAll<HTMLButtonElement>('[data-open]').forEach((b) => b.addEventListener('click', () => this.open(b.dataset.open as Panel)));
    $(this.root, '#hq-sound').addEventListener('click', () => {
      this.stage.focus({ preventScroll: true });
      this.toggleSound();
    });
    this.soundButton();
  }

  /** The speaker button and M: mute everything, or bring it back. */
  toggleSound(): void {
    sound.toggle();
    this.soundButton();
    if (sound.on) sound.play('select');
  }

  private soundButton(): void {
    const btn = $(this.root, '#hq-sound');
    btn.setAttribute('aria-pressed', String(sound.on));
    btn.title = sound.on ? 'Mute (M)' : 'Sound on (M)';
  }

  /** Open a panel from the HUD, unless something is already going on. */
  open(which: Panel): void {
    const game = this.game;
    if (!game.playing || game.busy) return;
    let restart = false;
    void game
      .run(async () => {
        if (which === 'dex') await dexPanel(this.sheet, game);
        if (which === 'goto') {
          const t = await gotoPanel(this.sheet, game);
          if (t) game.after(t);
        }
        if (which === 'menu') restart = (await menuPanel(this.sheet, this.touch)) === 'reset';
      })
      .then(() => {
        this.soundButton();
        if (!restart) return;
        game.reset();
        this.stage.focus({ preventScroll: true });
        void game.begin();
      });
  }

  /** A touch screen, by the same test the CSS uses to hide the key on the action button. */
  get touch(): boolean {
    return matchMedia('(pointer: coarse)').matches;
  }

  /** A dialog or card is in front of the game. */
  get modal(): boolean {
    return this.dialog.open || this.sheet.open;
  }

  say(lines: Line[]): Promise<void> {
    // keys advance the dialog from the stage, wherever focus was before
    if (!this.sheet.open) this.stage.focus({ preventScroll: true });
    const a = this.game.state.active;
    this.dialog.badge = a ? `M${missionById[a.id].n}` : 'HQ';
    return this.dialog.say(lines);
  }

  assign(task: AssignTask): Promise<void> {
    return assignPanel(this.sheet, task, () => this.tokens());
  }

  reward(view: RewardView): Promise<'archive' | 'close'> {
    return rewardPanel(this.sheet, view);
  }

  async vitrina(id: VitrinaId): Promise<void> {
    while ((await vitrinaPanel(this.sheet, id, this.game)) === 'again');
  }

  toast(text: string): void {
    const el = $(this.root, '#hq-toast');
    el.textContent = text;
    el.classList.add('on');
    sound.play('card');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => el.classList.remove('on'), 2800);
  }

  private tokens(): string {
    const a = this.game.state.active;
    return a ? `${a.tokens.toLocaleString('en-US')} / ${missionById[a.id].budget.toLocaleString('en-US')} tokens` : '';
  }

  refresh(): void {
    const g = this.game;
    $(this.root, '#hq-level').textContent = level(g.state);
    const objective = g.objective();
    $(this.root, '#hq-objective').textContent = objective;
    // the quest panel flashes when the objective moves on, not when the game first draws it
    if (this.shownObjective && objective !== this.shownObjective) {
      const quest = $(this.root, '#hq-quest');
      quest.classList.remove('flash');
      void quest.offsetWidth;
      quest.classList.add('flash');
    }
    this.shownObjective = objective;
    const a = g.state.active;
    $(this.root, '#hq-tokens').hidden = !a?.tokens;
    if (a) {
      const ratio = a.tokens / missionById[a.id].budget;
      const meter = $(this.root, '#hq-meter');
      meter.style.setProperty('--fill', `${Math.min(100, ratio * 100)}%`);
      meter.dataset.level = ratio > 1 ? 'over' : ratio > 0.8 ? 'near' : 'ok';
      $(this.root, '#hq-tokens-label').textContent = this.tokens();
    }
    $(this.root, '#hq-dex-count').textContent = `${g.state.agentdex.length}/${agents.length}`;
  }

  /** Show or hide the on-screen action button; called every frame, so only touch the DOM on change. */
  action(t: Interactable | null): void {
    const label = t && !this.modal ? actionLabel(t) : '';
    if (label === this.shownAction) return;
    this.shownAction = label;
    const btn = $<HTMLButtonElement>(this.root, '#hq-action');
    btn.hidden = !label;
    $(btn, '[data-label]').textContent = label;
  }
}
