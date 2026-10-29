// The ideas Agent HQ teaches, with the names the industry uses for them.

export type ConceptId = 'specialized' | 'orchestration' | 'tools' | 'routines' | 'context' | 'review' | 'hitl' | 'injection' | 'observability';

export interface Concept {
  id: ConceptId;
  title: string;
  summary: string;
}

export const concepts: Concept[] = [
  {
    id: 'specialized',
    title: 'Specialized agents',
    summary: 'Each agent has one role, its own instructions and its own tools. An agent for everything does everything halfway.',
  },
  {
    id: 'orchestration',
    title: 'Orchestration',
    summary: 'A coordinator splits a request into tasks, routes each one to the right agent and tracks its state.',
  },
  {
    id: 'tools',
    title: 'Tools and permissions',
    summary: 'An agent can only do what its tools allow, so it gets the minimum it needs.',
  },
  {
    id: 'routines',
    title: 'Routines and triggers',
    summary: 'Some work starts at a set time or when something happens, without anyone asking.',
  },
  {
    id: 'context',
    title: 'Context and memory',
    summary: 'An agent only knows what fits in its context. Whatever has to last goes into memory.',
  },
  {
    id: 'review',
    title: 'Review',
    summary: 'A reviewer agent checks the result and sends it back until it passes.',
  },
  {
    id: 'hitl',
    title: 'Human in the loop',
    summary: 'Anything that leaves the office needs a person’s approval.',
  },
  {
    id: 'injection',
    title: 'Untrusted input',
    summary: 'A document can carry hidden instructions, known as prompt injection. Permissions limit the damage.',
  },
  {
    id: 'observability',
    title: 'Observability',
    summary: 'Every action is logged, so you can follow the trail.',
  },
];

export const conceptById = Object.fromEntries(concepts.map((c) => [c.id, c])) as Record<ConceptId, Concept>;
