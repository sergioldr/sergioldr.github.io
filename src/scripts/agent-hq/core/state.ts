// Progress: who you've met, which missions you've finished and how well.

import { agents, type AgentId } from '../../../data/agents.ts';
import { unlockedBy, type VitrinaId } from '../../../data/archive.ts';
import { missions, type MissionId } from '../../../data/missions.ts';

export interface MissionResult {
  stars: 1 | 2 | 3;
  tokens: number;
}

export interface SaveData {
  v: 1;
  /** Past the welcome. */
  started: boolean;
  agentdex: AgentId[];
  done: Partial<Record<MissionId, MissionResult>>;
  /** The mission in progress and the tokens it has spent so far. */
  active: { id: MissionId; tokens: number } | null;
  /** The player asked to see every display case without playing. */
  uncoverAll: boolean;
}

/** Where progress lives: localStorage in the browser, memory in tests. */
export interface Store {
  load(): unknown;
  save(data: SaveData): void;
  clear(): void;
}

export const fresh = (): SaveData => ({ v: 1, started: false, agentdex: [], done: {}, active: null, uncoverAll: false });

const agentIds = new Set<string>(agents.map((a) => a.id));
const missionIds = new Set<string>(missions.map((m) => m.id));

/** Read saved progress, dropping anything that doesn't fit the current game. */
export function restore(raw: unknown): SaveData {
  const s = fresh();
  if (!raw || typeof raw !== 'object' || (raw as { v?: unknown }).v !== 1) return s;
  const r = raw as Partial<SaveData>;
  s.started = r.started === true;
  s.uncoverAll = r.uncoverAll === true;
  if (Array.isArray(r.agentdex)) s.agentdex = [...new Set(r.agentdex.filter((id) => agentIds.has(id)))];
  for (const [id, res] of Object.entries(r.done ?? {})) {
    if (missionIds.has(id) && res && [1, 2, 3].includes(res.stars) && Number.isFinite(res.tokens)) s.done[id as MissionId] = res;
  }
  if (r.active && missionIds.has(r.active.id) && Number.isFinite(r.active.tokens) && !s.done[r.active.id]) s.active = r.active;
  return s;
}

export function level(s: SaveData): string {
  const n = Object.keys(s.done).length;
  return n >= missions.length ? 'Harness architect' : n >= 3 ? 'Operator' : 'Intern';
}

export function isOpen(s: SaveData, id: VitrinaId): boolean {
  const by = unlockedBy(id);
  return s.uncoverAll || by === null || Boolean(s.done[by]);
}

/** The next playable mission that isn't finished yet. */
export const nextMission = (s: SaveData) => missions.find((m) => m.ready && !s.done[m.id]) ?? null;
