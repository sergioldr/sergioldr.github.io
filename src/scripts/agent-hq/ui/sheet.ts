// A modal card over the game: jobs to assign, rewards, display cases, the Agentdex.
// Focus moves in when it opens, stays inside while open and goes back when it closes.
// The card's <h2 id="hq-sheet-title" data-badge="…"> moves up into the tab on the frame.

import { sound } from '../audio/sound.ts';

export const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export class Sheet {
  private el: HTMLElement;
  /** The window: a tab with the title, a close button that stays put and the scrolling body. */
  private win: HTMLElement;
  private card: HTMLElement;
  private close: HTMLElement;
  private tag: HTMLElement;
  private title: HTMLElement;
  private back: HTMLElement | null = null;
  private cancel: (() => void) | null = null;

  constructor(el: HTMLElement) {
    this.el = el;
    this.win = el.firstElementChild as HTMLElement;
    this.card = this.win.querySelector('.hq-body')!;
    this.close = this.win.querySelector('[data-dismiss]')!;
    this.tag = this.win.querySelector('[data-badge]')!;
    this.title = this.win.querySelector('[data-title]')!;
    this.close.addEventListener('click', () => this.dismiss());
    el.addEventListener('click', (e) => {
      if (e.target === el) this.dismiss();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        this.dismiss();
      } else if (e.key === 'Tab') {
        const items = [...this.win.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((b) => !b.hidden);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  /**
   * Show `html` and let `wire` hook up its controls. The promise settles with whatever
   * `wire` passes to `done`, or with `fallback` if the player closes the card
   * (only possible when a fallback is given).
   */
  show<T>(html: string, wire: (card: HTMLElement, done: (value: T) => void) => void, fallback?: { value: T }): Promise<T> {
    this.back = document.activeElement as HTMLElement | null;
    this.card.innerHTML = html;
    this.card.scrollTop = 0;
    const h2 = this.card.querySelector<HTMLElement>('#hq-sheet-title');
    this.tag.textContent = h2?.dataset.badge ?? '';
    this.title.replaceChildren(...(h2 ? [h2] : []));
    this.close.hidden = !fallback;
    this.el.hidden = false;
    sound.play('open');
    return new Promise<T>((resolve) => {
      const done = (value: T) => {
        this.cancel = null;
        this.el.hidden = true;
        sound.play('close');
        this.card.innerHTML = '';
        this.title.replaceChildren();
        this.back?.focus({ preventScroll: true });
        resolve(value);
      };
      this.cancel = fallback ? () => done(fallback.value) : null;
      wire(this.card, done);
      this.card.querySelectorAll<HTMLElement>('[data-close]').forEach((b) => b.addEventListener('click', () => this.dismiss()));
      // with nothing to press inside, focus the close button or the window, so Escape and Tab still reach it
      const first = this.card.querySelector<HTMLElement>('[autofocus]') ?? this.card.querySelector<HTMLElement>(FOCUSABLE) ?? (fallback ? this.close : this.win);
      first.focus({ preventScroll: true });
    });
  }

  /** Close the card if it can be closed without choosing. */
  dismiss(): void {
    this.cancel?.();
  }
}
