// How every character looks: the eight human agents, the operator the player controls
// and H.E.R.B.I.E. Colors follow the reference illustrations in assets/agentes/.

import type { AgentId } from '../../../data/agents.ts';
import type { Grid, Palette } from '../engine/grid.ts';
import type { Face, Facing, Pose } from './body.ts';
import { renderHuman, type HumanLook } from './human.ts';
import { renderRobot } from './robot.ts';

export type CharacterId = AgentId | 'operator';

const HAIR: Record<string, Palette> = {
  darkBrown: { '#': '#3b281d', d: '#22160f', l: '#5c4231' },
  brown: { '#': '#5b3a25', d: '#3a2416', l: '#80583a' },
  chestnut: { '#': '#6e4127', d: '#4a2a17', l: '#93613e' },
  black: { '#': '#241b18', d: '#120c0a', l: '#47372f' },
  grey: { '#': '#d4cfc6', d: '#9f998f', l: '#f2efe9' },
};

const plaid = (x: number, y: number): string => {
  const a = x % 3 === 0;
  const b = y % 3 === 0;
  return a && b ? '#3b3c42' : a || b ? '#7d7f86' : '#dcdbd5';
};

const LOOKS: Record<Exclude<CharacterId, 'herbie'>, HumanLook> = {
  jarvis: {
    kind: 'human', hair: 'neat', hairColor: HAIR.darkBrown, outfit: 'vest',
    pal: { I: '#f3f1ec', i: '#cfc9bf', M: '#2a262f', m: '#18151c', T: '#121015', t: '#2a262f', X: '#5a5560', A: '#f3f1ec', a: '#cfc9bf', P: '#2a262f', p: '#18151c', F: '#1a1416', f: '#3a3238' },
  },
  friday: {
    kind: 'human', hair: 'longSide', hairColor: HAIR.chestnut, outfit: 'blazer', book: true,
    pal: { O: '#5e3b26', o: '#432817', I: '#efe2cd', T: '#16121a', X: '#c9a46a', A: '#5e3b26', a: '#432817', P: '#4c2f1d', p: '#341f12', F: '#2c1c14', f: '#4d3426' },
  },
  edith: {
    kind: 'human', hair: 'longCenter', hairColor: HAIR.brown, outfit: 'flannel',
    pal: { I: '#9e2a33', i: '#771d25', P: plaid, p: '#55565c', A: plaid, a: '#55565c', Pa: '#3a3a40', pa: '#26262b', F: '#26262b', f: '#f2f0ea', S: '#f2f0ea' },
  },
  arnim: {
    kind: 'human', hair: 'parted', hairColor: HAIR.darkBrown, outfit: 'labcoat', glasses: '#8a766c', tails: 3,
    pal: { O: '#f4f2ec', o: '#cbc7bd', M: '#2a262f', m: '#18151c', I: '#f4f2ec', T: '#8c1f2c', X: '#b5262f', A: '#f4f2ec', a: '#cbc7bd', P: '#2a262f', p: '#18151c', F: '#1a1416', f: '#3a3238' },
  },
  sentinel: {
    kind: 'human', hair: 'swept', hairColor: HAIR.darkBrown, outfit: 'suit',
    pal: { O: '#29252d', o: '#18151b', I: '#121014', X: '#c0303a', A: '#29252d', a: '#18151b', P: '#29252d', p: '#18151b', F: '#141013', f: '#3a3238' },
  },
  dume: {
    kind: 'human', hair: 'messy', hairColor: HAIR.brown, beard: 'full', beardColor: { '#': '#4a2d1b', d: '#2f1b0f', l: '#66412a' }, blush: false, outfit: 'jumpsuit',
    pal: { O: '#24375f', o: '#182746', L: '#30497a', I: '#182746', A: '#24375f', a: '#182746', P: '#24375f', p: '#182746', F: '#3b2618', f: '#5c3d28' },
  },
  u: {
    kind: 'human', hair: 'curly', hairColor: HAIR.black, outfit: 'jumpsuit',
    pal: { O: '#24375f', o: '#182746', L: '#30497a', I: '#16131a', A: '#24375f', a: '#182746', P: '#24375f', p: '#182746', F: '#141013', f: '#3a3238' },
  },
  ultron: {
    kind: 'human', hair: 'wisps', hairColor: HAIR.grey, beard: 'wizard', blush: false, glasses: '#6b5a52', hat: true, outfit: 'frock', tails: 5,
    pal: { O: '#6e2422', o: '#4d1716', M: '#5a3a24', m: '#3e2717', T: '#e9dcc4', t: '#b9a68a', X: '#e2b84a', A: '#6e2422', a: '#4d1716', P: '#2b2328', p: '#1a1418', F: '#3b2618', f: '#5c3d28' },
  },
  // The player: a new operator in a teal hoodie with a visitor badge on a lanyard.
  operator: {
    kind: 'human', hair: 'neat', hairColor: HAIR.chestnut, outfit: 'hoodie',
    pal: { O: '#3a9a8c', o: '#2a746a', I: '#22594f', R: '#d64545', B: '#f6f3ee', b: '#5b8cff', A: '#3a9a8c', a: '#2a746a', P: '#3a4a6b', p: '#28344d', F: '#f3f0e8', f: '#d8d3c8', S: '#b9b3a6' },
  },
};

/** One frame of a character. `face` is for the splash art only. */
export function renderCharacter(id: CharacterId, pose: Pose, frame: number, blink = false, facing: Facing = 'down', face?: Face): Grid {
  if (id === 'herbie') return renderRobot(pose, frame, blink, face);
  return renderHuman(LOOKS[id], pose, frame, blink, facing, face);
}
