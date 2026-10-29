// What goes inside the modal card: the job picker, mission rewards, display cases,
// the Agentdex, the "Go to" list and the menu.

import { agentById, agents, type AgentId } from '../../../data/agents.ts';
import { unlockedBy, vitrinaLabel, vitrinas, type VitrinaId } from '../../../data/archive.ts';
import { contact } from '../../../data/contact.ts';
import { education, languages, roles } from '../../../data/experience.ts';
import { missionById, missions } from '../../../data/missions.ts';
import { conceptById, concepts } from '../../../data/harness.ts';
import { sound, type Switch } from '../audio/sound.ts';
import type { AssignTask, Game, RewardView } from '../core/game.ts';
import type { Interactable } from '../world/map.ts';
import { icon } from './pixels.ts';
import { portrait } from './portraits.ts';
import { esc, type Sheet } from './sheet.ts';

const stars = (n: number) =>
  `<span class="stars" role="img" aria-label="${n} of 3 stars">${[0, 1, 2].map((i) => icon('star', i < n ? 'on' : 'off')).join('')}</span>`;
const face = (id: AgentId, cls = 'face') => `<img class="${cls}" src="${portrait(id)}" alt="" width="48" height="48" style="--accent:${agentById[id].accent}">`;

// ---------- job picker ----------

export function assignPanel(sheet: Sheet, task: AssignTask, tokens: () => string): Promise<void> {
  const html = `
    <h2 id="hq-sheet-title" data-badge="Job">${esc(task.title)}</h2>
    <p class="muted">${esc(task.prompt)}</p>
    <ol class="jobs">
      ${task.cards.map((c) => `<li><button type="button" class="job" data-card="${c.id}" aria-pressed="false"><span>${esc(c.text)}</span><span class="to"></span></button></li>`).join('')}
    </ol>
    <p class="pick-hint" aria-live="polite"></p>
    <div class="agents" role="group" aria-label="Agents">
      ${task.targets.map((id) => `<button type="button" class="btn agent" data-agent="${id}">${face(id)}<span>${esc(agentById[id].name)}</span></button>`).join('')}
    </div>
    <p class="feedback" aria-live="polite" hidden></p>
    <div class="actions">
      <span class="muted tokens"></span>
      <button type="button" class="btn primary" data-continue hidden>Continue</button>
    </div>`;

  return sheet.show<void>(html, (card, done) => {
    const assigned = new Set<string>();
    let selected = task.cards[0].id;
    let dragged = false;
    const hint = card.querySelector<HTMLElement>('.pick-hint')!;
    const feedback = card.querySelector<HTMLElement>('.feedback')!;
    const cont = card.querySelector<HTMLButtonElement>('[data-continue]')!;
    const tokenLabel = card.querySelector<HTMLElement>('.tokens')!;
    const jobs = [...card.querySelectorAll<HTMLButtonElement>('[data-card]')];

    const select = (id: string) => {
      selected = id;
      jobs.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.card === id)));
      const text = task.cards.find((c) => c.id === id)!.text;
      hint.textContent = `Now pick the agent for: “${text}”`;
    };

    const give = (agent: AgentId) => {
      if (assigned.has(selected)) return;
      const { ok, line } = task.pick(selected, agent);
      feedback.hidden = false;
      feedback.className = `feedback ${ok ? 'ok' : 'bad'}`;
      feedback.innerHTML = `${face(line.who)}<span><b>${esc(agentById[line.who].name)}</b> ${esc(line.text)}</span>`;
      tokenLabel.textContent = tokens();
      sound.play(ok ? 'ok' : agent === 'dume' ? 'crash' : 'bad');
      const btn = card.querySelector<HTMLElement>(`[data-agent="${agent}"]`)!;
      if (!ok) {
        btn.classList.remove('shake');
        void btn.offsetWidth;
        btn.classList.add('shake');
        return;
      }
      assigned.add(selected);
      const job = jobs.find((b) => b.dataset.card === selected)!;
      job.disabled = true;
      job.classList.add('done');
      job.querySelector('.to')!.textContent = `✓ ${agentById[agent].name}`;
      const next = jobs.find((b) => !assigned.has(b.dataset.card!));
      if (next) {
        select(next.dataset.card!);
      } else {
        hint.textContent = 'Every job has its agent.';
        cont.hidden = false;
        cont.focus();
      }
    };

    jobs.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (dragged) {
          dragged = false;
        } else {
          select(btn.dataset.card!);
          sound.play('select');
        }
      });
      // drag a job onto an agent
      btn.addEventListener('pointerdown', (e) => {
        if (btn.disabled || e.button !== 0) return;
        const start = { x: e.clientX, y: e.clientY };
        let ghost: HTMLElement | null = null;
        btn.setPointerCapture(e.pointerId);
        const over = (ev: PointerEvent) => (document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-agent]') ?? null;
        const move = (ev: PointerEvent) => {
          if (!ghost && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) {
            select(btn.dataset.card!);
            ghost = document.createElement('div');
            ghost.className = 'hq-ghost';
            ghost.textContent = btn.querySelector('span')!.textContent;
            document.body.append(ghost);
          }
          if (!ghost) return;
          ghost.style.left = `${ev.clientX}px`;
          ghost.style.top = `${ev.clientY}px`;
          card.querySelectorAll('.agent.over').forEach((a) => a.classList.remove('over'));
          over(ev)?.classList.add('over');
        };
        const up = (ev: PointerEvent) => {
          btn.removeEventListener('pointermove', move);
          btn.removeEventListener('pointerup', up);
          btn.removeEventListener('pointercancel', up);
          if (!ghost) return;
          ghost.remove();
          dragged = true;
          card.querySelectorAll('.agent.over').forEach((a) => a.classList.remove('over'));
          const target = ev.type === 'pointerup' ? over(ev) : null;
          if (target) give(target.dataset.agent as AgentId);
        };
        btn.addEventListener('pointermove', move);
        btn.addEventListener('pointerup', up);
        btn.addEventListener('pointercancel', up);
      });
    });
    card.querySelectorAll<HTMLButtonElement>('[data-agent]').forEach((b) => b.addEventListener('click', () => give(b.dataset.agent as AgentId)));
    cont.addEventListener('click', () => done());
    select(selected);
    tokenLabel.textContent = tokens();
  });
}

// ---------- mission complete ----------

export function rewardPanel(sheet: Sheet, v: RewardView): Promise<'archive' | 'close'> {
  const html = `
    <p class="kicker">Mission ${v.mission.n} · ${esc(v.mission.title)}</p>
    <h2 id="hq-sheet-title" data-badge="M${v.mission.n}">Mission complete</h2>
    <p class="score">${stars(v.stars)} <span class="muted">${v.tokens.toLocaleString('en-US')} tokens · budget ${v.mission.budget.toLocaleString('en-US')}</span></p>
    ${v.concepts.map((c) => `
      <section class="block concept">
        <p class="kicker">New in your Manual</p>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.summary)}</p>
      </section>`).join('')}
    <section class="block real">
      <p class="kicker">In real life · ${esc(v.role.company)} · ${esc(v.role.period)}</p>
      <h3>${esc(v.lead)}</h3>
      <blockquote>${esc(v.point)}</blockquote>
      ${v.uncovered ? '<p class="muted">U. has uncovered this case in the Archive.</p>' : ''}
    </section>
    <div class="actions">
      ${v.uncovered ? '<button type="button" class="btn primary" data-choice="archive" autofocus>See it in the Archive</button>' : ''}
      <button type="button" class="btn${v.uncovered ? '' : ' primary'}" data-choice="close">Keep exploring</button>
    </div>`;
  sound.fanfare(v.stars);
  return sheet.show<'archive' | 'close'>(
    html,
    (card, done) => card.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((b) => b.addEventListener('click', () => done(b.dataset.choice as 'archive' | 'close'))),
    { value: 'close' },
  );
}

// ---------- display cases ----------

/** Resolves with 'again' when the player uncovered every case, so the caller shows this one open. */
export function vitrinaPanel(sheet: Sheet, id: VitrinaId, game: Game): Promise<'again' | null> {
  const label = vitrinaLabel(id);
  const role = roles.find((r) => r.id === id);
  const year = role ? role.since : Math.min(...education.map((e) => Number(e.years.slice(0, 4))));
  let body: string;
  if (!game.isCaseOpen(id)) {
    const m = missionById[unlockedBy(id)!];
    body = `
      <div class="doc"><p>This case is still under a sheet. It comes off when you finish <b>Mission ${m.n} · ${esc(m.title)}</b>${m.ready ? '' : ', which is on its way'}.</p></div>
      <div class="actions">
        <button type="button" class="btn primary" data-uncover>Uncover every case now</button>
        <a class="btn" href="/experience/">Read the full experience</a>
      </div>`;
  } else if (!role) {
    body = `
      <div class="doc">
        <ul class="facts">${education.map((e) => `<li><b>${esc(e.degree)}</b><span class="muted">${esc(e.school)} · ${esc(e.years)}</span></li>`).join('')}</ul>
        <h3>Languages</h3>
        <ul class="facts">${languages.map((l) => `<li><b>${esc(l.name)}</b><span class="muted">${esc(l.level)}</span></li>`).join('')}</ul>
      </div>`;
  } else {
    const linked = new Map(missions.filter((m) => m.realLife.role === id).map((m) => [m.realLife.point, m]));
    body = `
      <div class="doc">
        <p class="muted">${esc(role.title)} · ${esc(role.period)} · ${esc(role.place)}</p>
        <ul class="points">
        ${role.points.map((p, i) => {
          const m = linked.get(i);
          const tag = m ? `<span class="tag">Mission ${m.n} · ${m.concepts.map((c) => esc(conceptById[c].title)).join(' and ')}</span>` : '';
          return `<li${m ? ' class="linked"' : ''}>${esc(p)}${tag}</li>`;
        }).join('')}
      </ul>
        <p class="stack">${role.stack.map((s) => `<span>${esc(s)}</span>`).join('')}</p>
      </div>`;
  }
  const html = `
    <p class="kicker">Archive</p>
    <h2 id="hq-sheet-title" data-badge="${year}">${esc(label)}</h2>
    ${body}`;
  return sheet.show<'again' | null>(
    html,
    (card, done) => {
      card.querySelector('[data-uncover]')?.addEventListener('click', () => {
        sound.play('uncover');
        game.uncoverAll();
        done('again');
      });
    },
    { value: null },
  );
}

// ---------- Agentdex ----------

export function dexPanel(sheet: Sheet, game: Game): Promise<void> {
  const met = new Set(game.state.agentdex);
  const html = `
    <p class="kicker">Agentdex</p>
    <h2 id="hq-sheet-title" data-badge="${met.size}/${agents.length}">The team</h2>
    <ul class="dex">
      ${agents.map((a) => met.has(a.id)
        ? `<li style="--accent:${a.accent}">${face(a.id)}<div><h3>${esc(a.name)}</h3><p>${esc(a.role)}</p><p class="muted"><b>Tools:</b> ${a.tools.map(esc).join(', ')}</p><p class="muted"><b>Character:</b> ${esc(a.character)}</p></div></li>`
        : `<li class="unknown">${face(a.id)}<div><h3>???</h3><p class="muted">Not met yet. Look for the “!”.</p></div></li>`).join('')}
    </ul>`;
  return sheet.show<void>(html, () => {}, { value: undefined });
}

// ---------- go to ----------

export function gotoPanel(sheet: Sheet, game: Game): Promise<Interactable | null> {
  const met = new Set(game.state.agentdex);
  const places: { label: string; note: string; t: Interactable | undefined }[] = [
    ...agents.filter((a) => a.id !== 'herbie').map((a) => ({ label: a.name, note: met.has(a.id) ? 'Met' : 'Not met yet', t: game.find({ kind: 'agent', agent: a.id }) })),
    ...vitrinas.map((v) => ({ label: `Archive · ${vitrinaLabel(v.id)}`, note: game.isCaseOpen(v.id) ? 'Uncovered' : 'Covered', t: game.find({ kind: 'vitrina', id: v.id }) })),
    { label: 'Sergio’s office', note: 'Locked', t: game.find({ kind: 'door', id: 'study' }) },
  ];
  const html = `
    <h2 id="hq-sheet-title" data-badge="Go!">Go to</h2>
    <p class="muted">H.E.R.B.I.E. knows the way. Pick a place and you’ll walk there.</p>
    <ul class="places">
      ${places.map((p, i) => `<li><button type="button" class="place" data-i="${i}"><span>${esc(p.label)}</span><span class="muted">${p.note}</span></button></li>`).join('')}
    </ul>`;
  return sheet.show<Interactable | null>(
    html,
    (card, done) => card.querySelectorAll<HTMLButtonElement>('[data-i]').forEach((b) => b.addEventListener('click', () => done(places[Number(b.dataset.i)].t ?? null))),
    { value: null },
  );
}

// ---------- menu ----------

/** Browser fullscreen for the whole page, where the browser has it (not on iPhone). */
export async function toggleFullscreen(): Promise<void> {
  if (!document.fullscreenEnabled) return;
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
  } catch {
    /* refused, or the page lost focus */
  }
}

const fullscreenLabel = () => (document.fullscreenElement ? 'Leave fullscreen' : 'Fullscreen');
const onOff = (which: Switch) => (sound.hears(which) ? 'On' : 'Off');

/** How to play, with keys and a mouse or on a touch screen. */
const HOW_TO: Record<'keys' | 'touch', [string, string][]> = {
  keys: [
    ['Move', 'Arrow keys or WASD, or click where you want to go'],
    ['Talk and look', 'E, Space or Enter next to someone, or click them'],
    ['Dialog', 'Any of those keys, or a click, to read on'],
    ['Go to', 'Walk anywhere from a list, no arrows needed'],
    ['Sound', 'M or the speaker button to mute; music and effects apart from this menu'],
  ],
  touch: [
    ['Move', 'Tap where you want to go'],
    ['Talk and look', 'Tap someone, or the button that shows up next to them'],
    ['Dialog', 'Tap to read on'],
    ['Go to', 'Walk anywhere from a list'],
    ['Sound', 'The speaker button mutes everything; music and effects apart from this menu'],
  ],
};

/** The pause menu. Resolves with 'reset' when the player chose to start over. On a touch screen it leaves out the keys. */
export function menuPanel(sheet: Sheet, touch: boolean): Promise<'reset' | null> {
  const key = (k: string) => (touch ? '' : `<span class="muted">${k}</span>`);
  const html = `
    <p class="kicker">Paused</p>
    <h2 id="hq-sheet-title" data-badge="II">Menu</h2>
    <ul class="places">
      <li><button type="button" class="place" data-close autofocus><span>Back to the game</span>${key('Esc')}</button></li>
      ${document.fullscreenEnabled ? `<li><button type="button" class="place" data-fullscreen><span>${fullscreenLabel()}</span>${key('F')}</button></li>` : ''}
      <li><button type="button" class="place" data-sound="music"><span>Music</span><span class="muted">${onOff('music')}</span></button></li>
      <li><button type="button" class="place" data-sound="sfx"><span>Sound effects</span><span class="muted">${onOff('sfx')}</span></button></li>
      <li><a class="place" href="/experience/"><span>Read the full experience</span></a></li>
      <li><button type="button" class="place" data-reset><span>Start over</span></button></li>
    </ul>
    <h3>Contact</h3>
    <ul class="places">
      ${contact.map((c) => `<li><a class="place" href="${c.href}"${c.href.startsWith('http') ? ' rel="me noopener"' : ''}><span>${esc(c.name)}</span><span class="muted">${esc(c.text)}</span></a></li>`).join('')}
    </ul>
    <h3>How to play</h3>
    <ul class="facts">
      ${HOW_TO[touch ? 'touch' : 'keys'].map(([what, how]) => `<li><b>${what}</b><span class="muted">${how}</span></li>`).join('')}
    </ul>
    <h3>What the game teaches</h3>
    <ol class="concepts">
      ${concepts.map((c) => `<li><b>${esc(c.title)}.</b> ${esc(c.summary)}</li>`).join('')}
    </ol>
    <p class="muted small">The missions and everything in them are fictional. Your progress stays in this browser.</p>`;
  return sheet.show<'reset' | null>(
    html,
    (card, done) => {
      const full = card.querySelector<HTMLButtonElement>('[data-fullscreen]');
      full?.addEventListener('click', () => {
        void toggleFullscreen().then(() => (full.querySelector('span')!.textContent = fullscreenLabel()));
      });
      // turning one on also lifts the mute, so both labels can change
      const switches = card.querySelectorAll<HTMLButtonElement>('[data-sound]');
      switches.forEach((b) =>
        b.addEventListener('click', () => {
          sound.flip(b.dataset.sound as Switch);
          switches.forEach((s) => (s.querySelector('.muted')!.textContent = onOff(s.dataset.sound as Switch)));
          sound.play('select');
        }),
      );
      const reset = card.querySelector<HTMLButtonElement>('[data-reset]')!;
      reset.addEventListener('click', () => {
        if (reset.dataset.armed) return done('reset');
        reset.dataset.armed = '1';
        reset.querySelector('span')!.textContent = `${touch ? 'Tap' : 'Click'} again to erase your progress`;
      });
    },
    { value: null },
  );
}
