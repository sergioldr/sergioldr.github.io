// The RPG dialog box: a tab with a tag and the speaker's name, a line typed out letter by
// letter and the speaker's splash art standing on the box. A press finishes the line; the
// next press moves on. Text between ** is highlighted. Screen readers get each whole line.
// The speaker's voice blips along with the letters.

import { agentById, type AgentId } from '../../../data/agents.ts';
import type { Line } from '../../../data/missions.ts';
import { sound } from '../audio/sound.ts';
import { Splash } from './splash.ts';

const CHARS_PER_SECOND = 48;

interface Run {
  text: string;
  hl: boolean;
}

/** A line split into plain and highlighted runs. */
const runs = (text: string): Run[] => text.split('**').map((t, i) => ({ text: t, hl: i % 2 === 1 }));

function piece(text: string, hl: boolean): Node {
  if (!hl) return document.createTextNode(text);
  const em = document.createElement('em');
  em.className = 'hl';
  em.textContent = text;
  return em;
}

export class Dialog {
  private el: HTMLElement;
  private who: HTMLElement;
  private tag: HTMLElement;
  private line: HTMLElement;
  private live: HTMLElement;
  private splash: Splash;
  private reduce: boolean;
  private queue: Line[] = [];
  private current: Run[] = [];
  private speaker: AgentId = 'herbie';
  /** The line without highlights, to tell letters from spaces as they type. */
  private plain = '';
  private length = 0;
  private shown = 0;
  private timer = 0;
  private done: (() => void) | null = null;
  /** When the last dialog closed, so a key press meant for it doesn't start another. */
  closedAt = 0;

  constructor(el: HTMLElement, reduce: boolean) {
    this.el = el;
    this.reduce = reduce;
    this.who = el.querySelector('[data-who]')!;
    this.tag = el.querySelector('[data-badge]')!;
    this.line = el.querySelector('[data-line]')!;
    this.live = el.querySelector('[data-live]')!;
    this.splash = new Splash(el.querySelector('canvas')!, reduce);
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.advance();
    });
  }

  get open(): boolean {
    return !this.el.hidden;
  }

  /** The tag on the tab: the mission in progress, or HQ. */
  set badge(text: string) {
    this.tag.textContent = text;
  }

  say(lines: Line[]): Promise<void> {
    if (!lines.length) return Promise.resolve();
    return new Promise((resolve) => {
      this.queue = [...lines];
      this.done = resolve;
      this.el.hidden = false;
      this.next();
    });
  }

  /** Finish the line being typed, or move to the next one. */
  advance(): void {
    if (!this.open) return;
    if (this.shown < this.length) {
      this.shown = this.length;
      this.render();
      return;
    }
    sound.play('next');
    this.next();
  }

  private next(): void {
    window.clearInterval(this.timer);
    const line = this.queue.shift();
    if (!line) {
      this.el.hidden = true;
      this.splash.hide();
      this.closedAt = performance.now();
      const done = this.done;
      this.done = null;
      done?.();
      return;
    }
    const agent = agentById[line.who];
    this.el.style.setProperty('--accent', agent.accent);
    this.who.textContent = agent.name;
    this.current = runs(line.text);
    this.speaker = line.who;
    this.plain = this.current.map((r) => r.text).join('');
    this.length = this.plain.length;
    this.live.textContent = `${agent.name}: ${this.plain}`;
    this.splash.show(line.who, line.mood);
    this.shown = this.reduce ? this.length : 0;
    this.render();
    if (!this.reduce) {
      this.timer = window.setInterval(() => {
        this.shown++;
        // a syllable every other letter, never on spaces or punctuation
        if (this.shown % 2 === 0 && /[\p{L}\p{N}]/u.test(this.plain[this.shown - 1])) sound.blip(this.speaker);
        this.render();
        if (this.shown >= this.length) window.clearInterval(this.timer);
      }, 1000 / CHARS_PER_SECOND);
    }
  }

  /** The typed part, then the rest of the line invisible so the box doesn't grow while typing. */
  private render(): void {
    const typed: Node[] = [];
    const rest = document.createElement('span');
    rest.className = 'rest';
    let left = this.shown;
    for (const r of this.current) {
      const cut = Math.max(0, Math.min(r.text.length, left));
      if (cut) typed.push(piece(r.text.slice(0, cut), r.hl));
      if (cut < r.text.length) rest.append(piece(r.text.slice(cut), r.hl));
      left -= r.text.length;
    }
    this.line.replaceChildren(...typed, rest);
    const typing = this.shown < this.length;
    this.el.classList.toggle('typing', typing);
    this.splash.speak(typing);
  }
}
