// Agent HQ in the browser: wires the game to the canvas, the keyboard, taps, the HTML UI
// and the sound. It is the landing page: Herbie first offers the experience or the game,
// and play starts once the visitor picks the game.

import { sound } from './audio/sound.ts';
import { Game } from './core/game.ts';
import type { Store } from './core/state.ts';
import { loop } from './engine/canvas.ts';
import { DomUI } from './ui/dom.ts';
import { toggleFullscreen } from './ui/panels.ts';
import { title } from './ui/title.ts';
import { STRIDE, Scene } from './world/scene.ts';

const KEY = 'agent-hq:v1';

// Progress lives in localStorage when the browser allows it; otherwise the game simply starts fresh.
const store: Store = {
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* private mode or storage disabled */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* nothing to clear */
    }
  },
};

const DIRS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  KeyW: [0, -1],
  ArrowDown: [0, 1],
  KeyS: [0, 1],
  ArrowLeft: [-1, 0],
  KeyA: [-1, 0],
  ArrowRight: [1, 0],
  KeyD: [1, 0],
};
const ACT = new Set(['Enter', 'Space', 'KeyE']);
/** Gestures that let a page start making sound; iOS only counts the ones that end a touch. */
const GESTURES = ['pointerup', 'touchend', 'keydown'];

/** One pixel of the interface: a little finer than the office's, in whole device pixels. */
function uiPixel(scale: number): number {
  const dpr = window.devicePixelRatio || 1;
  return Math.round(Math.max(2, Math.round(scale * 0.6)) * dpr) / dpr;
}

function start(root: HTMLElement): void {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = root.querySelector<HTMLElement>('#hq-stage')!;
  const canvas = root.querySelector<HTMLCanvasElement>('#hq-canvas')!;
  const ui = new DomUI(root, stage, reduce);
  const game = new Game(ui, store);
  ui.bind(game);
  const scene = new Scene(canvas, game, reduce);
  ui.refresh();
  // the page's label lists the keys; a touch screen has none
  if (ui.touch) stage.setAttribute('aria-label', 'Agent HQ, a game. Tap where you want to go and tap someone to talk.');

  // the interface is measured in pixels of the game, so it scales with the office
  const html = document.documentElement;
  new ResizeObserver(() => {
    scene.resize(stage.clientWidth, stage.clientHeight);
    html.style.setProperty('--scale', `${scene.scale}px`);
    html.style.setProperty('--px', `${uiPixel(scene.scale)}px`);
  }).observe(stage);

  // sound starts with the first tap or key press, wherever it lands
  const unlock = () => {
    void sound.unlock().then((ok) => {
      if (ok) GESTURES.forEach((g) => window.removeEventListener(g, unlock, true));
    });
  };
  GESTURES.forEach((g) => window.addEventListener(g, unlock, true));

  // keyboard: only while the stage itself has focus, so the HUD buttons keep their keys
  const held = new Set<string>();
  stage.addEventListener('keydown', (e) => {
    if (e.target !== stage || root.dataset.screen === 'title') return;
    if (e.code === 'KeyM') {
      e.preventDefault();
      if (!e.repeat) ui.toggleSound();
      return;
    }
    if (ui.dialog.open) {
      if (ACT.has(e.code)) {
        e.preventDefault();
        if (!e.repeat) ui.dialog.advance();
      }
      return;
    }
    if (e.code === 'Escape') {
      e.preventDefault();
      ui.open('menu');
    } else if (e.code === 'KeyF') {
      e.preventDefault();
      if (!e.repeat) void toggleFullscreen();
    } else if (DIRS[e.code]) {
      e.preventDefault();
      held.add(e.code);
    } else if (ACT.has(e.code)) {
      e.preventDefault();
      const t = game.nearest();
      if (t && !e.repeat && performance.now() - ui.dialog.closedAt > 300) void game.interact(t);
    }
  });
  stage.addEventListener('keyup', (e) => held.delete(e.code));
  stage.addEventListener('blur', () => held.clear());

  // taps and clicks: walk there, or walk up to whoever was tapped
  canvas.addEventListener('click', (e) => {
    stage.focus({ preventScroll: true });
    if (ui.dialog.open) return ui.dialog.advance();
    if (!game.playing) return;
    const p = scene.toWorld(e.clientX, e.clientY);
    const t = scene.hit(p);
    if (t) game.goTo(t);
    else game.walkTo(p);
  });

  root.querySelector('#hq-action')!.addEventListener('click', () => {
    stage.focus({ preventScroll: true });
    const t = game.nearest();
    if (t) void game.interact(t);
  });

  // a footstep each time a foot comes down in the walk cycle (frames 1 and 3)
  let stride = 0;
  loop(stage, (now, dt) => {
    let dx = 0;
    let dy = 0;
    if (!ui.modal) {
      for (const code of held) {
        dx += DIRS[code][0];
        dy += DIRS[code][1];
      }
    }
    game.update(dt, { dx: Math.sign(dx), dy: Math.sign(dy) });
    const s = Math.floor(game.player.walked / STRIDE);
    if (game.player.moving && s !== stride && s % 2 === 1) sound.play('step');
    stride = s;
    scene.draw(now, dt);
    ui.action(game.nearest());
  });

  // the office waits, dimmed, behind the title screen
  void title(root, game.state.started, reduce).then(() => {
    stage.focus({ preventScroll: true });
    return game.begin();
  });
}

const root = document.getElementById('hq');
if (root) start(root);
