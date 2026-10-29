// The title screen: Herbie standing between the two ways in, the experience and the game.
// No words from him, just poses: a wave to start, a hop towards the experience, a cheer
// for the game. Arrow keys move between the two; Play (or Continue) lets the game begin.

import type { Mood } from '../../../data/missions.ts';
import { sound } from '../audio/sound.ts';
import { Splash } from './splash.ts';

/** Wait on the title screen until the visitor chooses to play. */
export function title(root: HTMLElement, started: boolean, reduce: boolean): Promise<void> {
  const screen = root.querySelector<HTMLElement>('#hq-title')!;
  const play = screen.querySelector<HTMLButtonElement>('#hq-play')!;
  const choices = [...screen.querySelectorAll<HTMLElement>('.choice')];
  const herbie = new Splash(screen.querySelector('canvas')!, reduce);

  if (started) play.querySelector('[data-label]')!.textContent = 'Continue';
  play.focus({ preventScroll: true });
  herbie.show('herbie', 'greet');

  // he reacts to whichever choice is pointed at, or else the one with focus
  let hovered: HTMLElement | null = null;
  let mood: Mood = 'greet';
  const react = () => {
    const at = hovered ?? choices.find((c) => c === document.activeElement);
    const next = (at?.dataset.mood as Mood | undefined) ?? 'happy';
    if (next === mood) return;
    mood = next;
    herbie.show('herbie', next);
  };
  for (const c of choices) {
    c.addEventListener('pointerenter', () => {
      hovered = c;
      react();
    });
    c.addEventListener('pointerleave', () => {
      hovered = null;
      react();
    });
    c.addEventListener('focus', react);
    c.addEventListener('blur', react);
  }

  // left and up go to the first choice, right and down to the last
  screen.addEventListener('keydown', (e) => {
    const back = e.code === 'ArrowLeft' || e.code === 'ArrowUp';
    if (!back && e.code !== 'ArrowRight' && e.code !== 'ArrowDown') return;
    e.preventDefault();
    const to = back ? choices[0] : choices[choices.length - 1];
    if (to !== document.activeElement) {
      to.focus({ preventScroll: true });
      sound.play('select');
    }
  });

  return new Promise((resolve) => {
    play.addEventListener(
      'click',
      () => {
        sound.play('ok');
        herbie.hide();
        root.dataset.screen = 'play';
        resolve();
      },
      { once: true },
    );
  });
}
