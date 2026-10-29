// Playable missions by id. The rest of the seven are listed in data/missions.ts as not ready.

import type { MissionId } from '../../../data/missions.ts';
import type { MissionScript } from '../core/game.ts';
import { firstDayMission } from './m1.ts';

export const scripts: Partial<Record<MissionId, MissionScript>> = {
  m1: firstDayMission,
};
