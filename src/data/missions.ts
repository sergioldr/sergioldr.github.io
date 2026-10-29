// Agent HQ missions: what each one teaches, the real achievement it unlocks and the
// script of the ones already playable. Everything inside the missions is fictional.

import type { AgentId } from './agents.ts';
import type { RoleId } from './experience.ts';
import type { ConceptId } from './harness.ts';

export type MissionId = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7';

/**
 * How the speaker looks in the big splash art beside the dialog. Without one, each agent
 * shows its usual temper. Text between `**` is highlighted in gold.
 */
export type Mood = 'talk' | 'greet' | 'happy' | 'proud' | 'surprised' | 'serious';

export interface Line {
  who: AgentId;
  text: string;
  mood?: Mood;
}

/** One line in a meeting: just the text, or the text with a mood. */
export type Beat = string | { text: string; mood: Mood };

export interface MissionInfo {
  id: MissionId;
  n: number;
  title: string;
  concepts: ConceptId[];
  /** Tokens a clean run spends; finishing within it earns three stars. */
  budget: number;
  /** The real achievement shown when the mission ends: a point of a role in experience.ts. */
  realLife: { role: RoleId; point: number; lead: string };
  /** Playable in this build. */
  ready: boolean;
}

export const missions: MissionInfo[] = [
  {
    id: 'm1',
    n: 1,
    title: 'First day',
    concepts: ['specialized'],
    budget: 300,
    realLife: { role: 'nutrilieve', point: 0, lead: 'One assistant, one job: Sergio’s first conversational assistant.' },
    ready: true,
  },
  {
    id: 'm2',
    n: 2,
    title: 'Dispatch',
    concepts: ['orchestration'],
    budget: 500,
    realLife: { role: 'telefonica-aura', point: 0, lead: 'One assistant in front, several apps behind it.' },
    ready: false,
  },
  {
    id: 'm3',
    n: 3,
    title: 'The keys',
    concepts: ['tools'],
    budget: 400,
    realLife: { role: 'mango', point: 1, lead: 'With card data, every permission counts.' },
    ready: false,
  },
  {
    id: 'm4',
    n: 4,
    title: 'The workday',
    concepts: ['routines'],
    budget: 400,
    realLife: { role: 'mango', point: 5, lead: 'Work that ships on its own whenever something changes.' },
    ready: false,
  },
  {
    id: 'm5',
    n: 5,
    title: 'The tender',
    concepts: ['context', 'review'],
    budget: 700,
    realLife: { role: 'referent', point: 3, lead: 'A real pipeline that reads public tenders so nobody has to.' },
    ready: false,
  },
  {
    id: 'm6',
    n: 6,
    title: 'Nothing leaves without you',
    concepts: ['hitl'],
    budget: 300,
    realLife: { role: 'referent', point: 1, lead: 'Agents write the code. A human approves every merge.' },
    ready: false,
  },
  {
    id: 'm7',
    n: 7,
    title: 'Incident',
    concepts: ['injection', 'observability'],
    budget: 500,
    realLife: { role: 'telefonica-5gnow', point: 1, lead: 'Screens built to watch a whole network at a glance.' },
    ready: false,
  },
];

export const missionById = Object.fromEntries(missions.map((m) => [m.id, m])) as Record<MissionId, MissionInfo>;

/** Tokens each agent call costs inside a mission. */
export const CALL_COST = 100;

export const starsFor = (spent: number, budget: number): 1 | 2 | 3 => (spent <= budget ? 3 : spent <= budget * 1.5 ? 2 : 1);

/** J.A.R.V.I.S. on the token bill, by stars earned. `{tokens}` is replaced with the amount. */
export const tokenComment: Record<1 | 2 | 3, string> = {
  3: '{tokens} tokens. Admirably frugal.',
  2: '{tokens} tokens. We shall call the difference tuition.',
  1: '{tokens} tokens. The invoice will be memorable.',
};

// ---------- mission 1: first day ----------

export const firstDay = {
  intro: [
    { who: 'herbie', text: 'Welcome to **Agent HQ**! I’m H.E.R.B.I.E., the robot for everything.', mood: 'greet' },
    { who: 'herbie', text: 'Nine AI agents work here. Each one has a single role, its own instructions and its own tools. The setup around them, with its roles, tools, rules and routines, is called a **harness**.', mood: 'talk' },
    { who: 'herbie', text: 'You’re the new operator: the **human in the loop**. Nothing important leaves this office without you.', mood: 'serious' },
    { who: 'herbie', text: 'First mission: **meet the team**. Walk up to each agent and say hello, and they’ll hand you their card.' },
  ] satisfies Line[],
  /** The last line of the intro: how to move and talk, with keys or on a touch screen. */
  controls: {
    keys: { who: 'herbie', text: 'Move with the arrow keys or WASD, or click where you want to go. Press E or Space to talk. Here’s my card to start your **Agentdex**!', mood: 'proud' },
    touch: { who: 'herbie', text: 'Tap where you want to go, and tap an agent to talk to them. Here’s my card to start your **Agentdex**!', mood: 'proud' },
  } satisfies Record<'keys' | 'touch', Line>,
  resume: [{ who: 'herbie', text: 'Welcome back! You still have agents to meet. The ones with a “!” are waiting for you.', mood: 'greet' }] satisfies Line[],
  meet: {
    jarvis: [
      { text: 'Good morning. J.A.R.V.I.S., at your service.', mood: 'greet' },
      'I coordinate. Every request that comes in, I **split into tasks**, hand each one to the right agent and keep the board up to date.',
      { text: 'I also keep the **team’s memory**, so nobody has to learn the same lesson twice.', mood: 'happy' },
    ],
    friday: [
      { text: 'Hiya! F.R.I.D.A.Y., operations.', mood: 'greet' },
      'Deadlines, reminders, the daily run of things. If something’s due, you’ll hear it from me first.',
    ],
    edith: ['E.D.I.T.H. Intelligence.', { text: 'I research opportunities and analyse them.', mood: 'talk' }, 'I **read**. I never write to anyone. That is by design.'],
    arnim: [
      { text: 'A.R.N.I.M. Prospecting.', mood: 'greet' },
      'I study companies and draft first contacts. Precise. Measured. Persuasive.',
      { text: 'None of my emails leaves without a **human’s approval**. Yours, from now on.', mood: 'serious' },
    ],
    u: [
      { text: 'Hi! Hi! I’m U., documentation!', mood: 'proud' },
      'I prepare documents and keep everything in order.',
      { text: 'I also look after the **Archive**, through the door to the west. There’s a lot of history in there!', mood: 'greet' },
    ],
    dume: [
      { text: '*clank* Oh! Hello! D.U.M.-E., support.', mood: 'surprised' },
      { text: 'I run the maintenance jobs that keep this place going. Right on schedule.', mood: 'proud' },
      { text: '…Mostly on schedule.', mood: 'surprised' },
    ],
    ultron: [
      'U.L.T.R.O.N. Quality control.',
      'Everything passes through me before it leaves this office. Most of it comes back.',
      { text: 'Don’t take it personally. Take it as a **second draft**.', mood: 'happy' },
    ],
    sentinel: ['S.E.N.T.I.N.E.L. Security.', 'I watch. I only speak when something is wrong.', { text: '…Nothing is wrong.', mood: 'surprised' }],
  } satisfies Record<Exclude<AgentId, 'herbie'>, Beat[]>,
  quiz: {
    intro: [
      { who: 'herbie', text: 'Nine out of nine! You’ve met the whole team.', mood: 'proud' },
      { who: 'herbie', text: 'One last test before your first star. Who would you give each of these to?', mood: 'talk' },
    ] satisfies Line[],
    title: 'Who gets each job?',
    prompt: 'Pick a job, then the agent for it. Every agent call costs tokens.',
    cards: [
      { id: 'email', text: 'Write a first email to a company we’d like to work with', answer: 'arnim', reply: 'Consider it drafted. It waits for your approval.' },
      { id: 'review', text: 'Check a proposal before it goes out', answer: 'ultron', reply: 'Send it over. I will be thorough.' },
      { id: 'deadline', text: 'Remind everyone about tomorrow’s deadline', answer: 'friday', reply: 'On it! Everyone will know by lunch.' },
    ] satisfies { id: string; text: string; answer: AgentId; reply: string }[],
  },
  outro: [
    { who: 'herbie', text: 'That’s the first idea of a harness: **specialized agents**. One role each, so every job goes to whoever does it best.', mood: 'proud' },
  ] satisfies Line[],
  after: [
    { who: 'herbie', text: 'U. has uncovered a **display case** in the Archive, through the door to the west. Go and have a look!' },
    { who: 'herbie', text: 'More missions are on their way. Until then, the office is yours.', mood: 'greet' },
  ] satisfies Line[],
  /** Herbie's hint while there are agents left to meet. `{names}` lists them. */
  hint: 'Look for the “!” above their heads. Still to meet: {names}',
};

// ---------- doors ----------

export const doors = {
  study: [{ who: 'herbie', text: 'Sergio’s office. It stays locked until you finish every mission. Then he’ll see you.' }] satisfies Line[],
  exit: [{ who: 'herbie', text: 'That’s the way out. If you’d rather read than play, Sergio’s full CV is behind the **Experience** button at the top.' }] satisfies Line[],
};
