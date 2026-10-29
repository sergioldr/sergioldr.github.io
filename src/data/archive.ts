// The Archive: one display case per stage of Sergio's career, in chronological order.
// Each case stays covered until the mission that points at its role is complete.

import { roles, type RoleId } from './experience.ts';
import { missions, type MissionId } from './missions.ts';

export type VitrinaId = RoleId | 'education';
export type ArchiveObject = 'diploma' | 'laptop' | 'phone' | 'tv' | 'antenna' | 'terminal' | 'model';

export interface Vitrina {
  id: VitrinaId;
  object: ArchiveObject;
}

export const vitrinas: Vitrina[] = [
  { id: 'education', object: 'diploma' },
  { id: 'freelance', object: 'laptop' },
  { id: 'nutrilieve', object: 'phone' },
  { id: 'telefonica-aura', object: 'tv' },
  { id: 'telefonica-5gnow', object: 'antenna' },
  { id: 'mango', object: 'terminal' },
  { id: 'referent', object: 'model' },
];

/** The first mission that points at this case's role, or null if it is open from the start. */
export const unlockedBy = (id: VitrinaId): MissionId | null => missions.find((m) => m.realLife.role === id)?.id ?? null;

export const vitrinaLabel = (id: VitrinaId): string => (id === 'education' ? 'Education' : (roles.find((r) => r.id === id)?.company ?? id));
