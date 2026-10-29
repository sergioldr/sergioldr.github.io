// The experience page's only script. The "Ask your AI" menu closes like any menu, and on a
// first visit H.E.R.B.I.E. waves from a window to say the record can be asked to the
// visitor's own AI instead of read. Without JavaScript nothing opens by itself, and the menu
// still opens and closes on its button.

import { Splash } from './agent-hq/ui/splash.ts';

const KEY = 'agent-hq:ask-ai-seen';

// the menu closes on a click outside it, on Escape, and once an assistant is picked
const ask = document.querySelector<HTMLDetailsElement>('.ask');
if (ask) {
  document.addEventListener('click', (e) => {
    if (ask.open && !ask.contains(e.target as Node)) ask.open = false;
  });
  ask.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !ask.open) return;
    ask.open = false;
    ask.querySelector('summary')!.focus();
  });
  for (const a of ask.querySelectorAll('a')) a.addEventListener('click', () => (ask.open = false));
}

// the announcement shows once per visitor; without storage, every visit asks
function seen(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return false;
  }
}

function remember(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* private mode or storage disabled */
  }
}

const dialog = document.querySelector<HTMLDialogElement>('#ask-ai');
if (dialog && !seen()) {
  const herbie = new Splash(dialog.querySelector('canvas')!, matchMedia('(prefers-reduced-motion: reduce)').matches);
  dialog.addEventListener('close', () => herbie.hide());
  // an assistant opens in a new tab, so this one is done; so is a click on the dimmed page
  for (const a of dialog.querySelectorAll('a')) a.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.showModal();
  herbie.show('herbie', 'greet');
  remember();
}
