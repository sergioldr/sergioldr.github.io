// Mission 1 · First day. Meet the nine agents, collect their cards, then hand three
// jobs to the right agent. Teaches: specialized agents.

import { agentById, agents, type AgentId } from '../../../data/agents.ts';
import { CALL_COST, firstDay } from '../../../data/missions.ts';
import type { Game, MissionScript } from '../core/game.ts';

const left = (g: Game): AgentId[] => agents.map((a) => a.id).filter((id) => !g.state.agentdex.includes(id));

async function finale(g: Game): Promise<void> {
  const { quiz } = firstDay;
  await g.say(quiz.intro);
  await g.ui.assign({
    title: quiz.title,
    prompt: quiz.prompt,
    cards: quiz.cards.map(({ id, text }) => ({ id, text })),
    targets: agents.map((a) => a.id),
    pick(cardId, agent) {
      g.spend(CALL_COST);
      const card = quiz.cards.find((c) => c.id === cardId)!;
      const ok = card.answer === agent;
      g.mood(agent, ok ? 'cheer' : 'wave', 1.3);
      return { ok, line: { who: agent, text: ok ? card.reply : agentById[agent].notMine } };
    },
  });
  await g.say(firstDay.outro);
  const choice = await g.complete('m1');
  await g.say(firstDay.after);
  const nutrilieve = g.find({ kind: 'vitrina', id: 'nutrilieve' });
  if (choice === 'archive' && nutrilieve) g.after(nutrilieve);
}

export const firstDayMission: MissionScript = {
  id: 'm1',

  objective(g) {
    return `Meet the team · ${g.state.agentdex.length}/${agents.length}`;
  },

  async start(g, resumed) {
    if (!resumed || !g.state.agentdex.includes('herbie')) {
      g.mood('herbie', 'wave', 2.5);
      await g.say([...firstDay.intro, firstDay.controls[g.ui.touch ? 'touch' : 'keys']]);
      g.addCard('herbie');
    } else if (!left(g).length) {
      await finale(g);
    } else {
      await g.say(firstDay.resume);
    }
  },

  async talk(g, agent) {
    if (agent === 'herbie') {
      const names = left(g).map((id) => agentById[id].name);
      if (!names.length) return false;
      await g.say([{ who: 'herbie', text: firstDay.hint.replace('{names}', names.join(', ')) }]);
      return true;
    }
    if (g.state.agentdex.includes(agent)) return false;
    await g.say(firstDay.meet[agent].map((beat) => (typeof beat === 'string' ? { who: agent, text: beat } : { who: agent, ...beat })));
    g.addCard(agent);
    g.mood(agent, 'cheer', 1.3);
    if (!left(g).length) await finale(g);
    return true;
  },
};
