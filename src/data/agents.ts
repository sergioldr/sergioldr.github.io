// The nine agents of Agent HQ, as the public game presents them. Real roles, schedules,
// tools and internal names stay out of this file: the repo and the game are public.

export type AgentId = 'herbie' | 'jarvis' | 'friday' | 'edith' | 'arnim' | 'u' | 'dume' | 'ultron' | 'sentinel';

export interface Agent {
  id: AgentId;
  /** Dotted name used in dialogue. */
  name: string;
  /** Short name for the plates on the desks. */
  short: string;
  role: string;
  tools: string[];
  character: string;
  accent: string;
  /** What they say once you have met them. */
  idle: string;
  /** Their reply when you hand them work that isn't theirs. */
  notMine: string;
}

export const agents: Agent[] = [
  {
    id: 'herbie',
    name: 'H.E.R.B.I.E.',
    short: 'HERBIE',
    role: 'Personal assistant, the robot for everything',
    tools: ['Errands', 'Guided tours'],
    character: 'Loyal, meticulous, helpful',
    accent: '#2f9bb5',
    idle: 'The robot for everything, at your service! Open “Go to” and I’ll take you anywhere.',
    notMine: 'I could do it, but someone here does it better!',
  },
  {
    id: 'jarvis',
    name: 'J.A.R.V.I.S.',
    short: 'JARVIS',
    role: 'Coordinator: splits the work, routes it, tracks it and keeps the team’s memory',
    tools: ['Task board', 'Team memory'],
    character: 'British butler: calm, precise, dry wit',
    accent: '#5b8cff',
    idle: 'The board is in order. For now.',
    notMine: 'I would only pass it on. Better to go straight to the right agent.',
  },
  {
    id: 'friday',
    name: 'F.R.I.D.A.Y.',
    short: 'FRIDAY',
    role: 'Operations: the daily run, reminders and deadlines',
    tools: ['Calendar', 'Reminders'],
    character: 'Irish lilt, practical, warm',
    accent: '#e0894b',
    idle: 'Nothing due today. Enjoy it while it lasts.',
    notMine: 'Not my lane, love. Try someone else.',
  },
  {
    id: 'edith',
    name: 'E.D.I.T.H.',
    short: 'EDITH',
    role: 'Intelligence: researches and analyses opportunities, and only ever reads',
    tools: ['Web search (read-only)', 'Document reader'],
    character: 'Cold and methodical',
    accent: '#e05561',
    idle: 'Reading.',
    notMine: 'I only read.',
  },
  {
    id: 'arnim',
    name: 'A.R.N.I.M.',
    short: 'ARNIM',
    role: 'Prospecting: researches companies and drafts first contacts that never leave without approval',
    tools: ['Company research', 'Email drafts (no sending)'],
    character: 'Analytical, calculating, a scientist’s mind',
    accent: '#d64545',
    idle: 'Drafting. Nothing is sent without you.',
    notMine: 'Outside my field of study.',
  },
  {
    id: 'u',
    name: 'U.',
    short: 'U',
    role: 'Documentation: prepares documents and keeps them in order',
    tools: ['Document editor', 'Archive'],
    character: 'Diligent and eager',
    accent: '#47b26b',
    idle: 'Have you been to the Archive yet? It’s through the door to the west!',
    notMine: 'Ooh, I’d love to, but that one isn’t mine!',
  },
  {
    id: 'dume',
    name: 'D.U.M.-E.',
    short: 'DUME',
    role: 'Support: recurring maintenance jobs',
    tools: ['Maintenance jobs'],
    character: 'Endearing, well-meaning, a bit clumsy',
    accent: '#3d6fd6',
    idle: 'Everything’s running! …I think.',
    notMine: 'I’ll try! …*crash* Oh no.',
  },
  {
    id: 'ultron',
    name: 'U.L.T.R.O.N',
    short: 'ULTRON',
    role: 'Quality control: reviews everything before it leaves',
    tools: ['Review', 'Approve or send back'],
    character: 'Brilliant, a little rebellious, a merciless critic',
    accent: '#b0413e',
    idle: 'Send me something. I’ll find the flaw.',
    notMine: 'Wrong agent. Consider that decision a first draft.',
  },
  {
    id: 'sentinel',
    name: 'S.E.N.T.I.N.E.L.',
    short: 'SENTINEL',
    role: 'Security: watches, and only speaks up when something is wrong',
    tools: ['Monitoring (read-only)', 'Alerts'],
    character: 'Dry and direct',
    accent: '#c23a3a',
    idle: 'All quiet.',
    notMine: 'Not my job.',
  },
];

export const agentById = Object.fromEntries(agents.map((a) => [a.id, a])) as Record<AgentId, Agent>;
