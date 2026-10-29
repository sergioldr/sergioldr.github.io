// Head-and-shoulders portraits cut from each character's first idle frame, as image URLs
// for the dialog box, the Agentdex and the job picker.

import { toCanvas } from '../engine/canvas.ts';
import { renderCharacter, type CharacterId } from '../sprites/cast.ts';

const cache = new Map<CharacterId, string>();

export function portrait(id: CharacterId): string {
  let url = cache.get(id);
  if (!url) {
    const frame = toCanvas(renderCharacter(id, 'idle', 0));
    const c = document.createElement('canvas');
    c.width = 24;
    c.height = 24;
    c.getContext('2d')!.drawImage(frame, 4, 2, 24, 24, 0, 0, 24, 24);
    url = c.toDataURL();
    cache.set(id, url);
  }
  return url;
}
