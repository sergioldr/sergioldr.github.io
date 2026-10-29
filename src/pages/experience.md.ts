import type { APIRoute } from 'astro';
import { roles, education, languages } from '../data/experience';
import { contact } from '../data/contact';

// The experience page as Markdown: what Claude or ChatGPT reads when "Ask your AI" opens them.
export const GET: APIRoute = ({ site }) => {
  const lines = [
    '# Sergio Lozano del Río',
    '',
    'Senior Frontend Engineer · React, TypeScript, Payments. 8+ years of React.',
    '',
    `Source: ${new URL('/experience', site)}`,
    '',
    '## Experience',
    ...roles.flatMap((r) => [
      '',
      `### ${r.title} · ${r.company}`,
      '',
      `${r.period} · ${r.place}`,
      '',
      ...r.points.map((p) => `- ${p}`),
      '',
      `Stack: ${r.stack.join(', ')}`,
    ]),
    '',
    '## Education',
    '',
    ...education.map((e) => `- ${e.degree}, ${e.school} (${e.years})`),
    '',
    '## Languages',
    '',
    ...languages.map((l) => `- ${l.name}: ${l.level}`),
    '',
    '## Contact',
    '',
    ...contact.map((c) => `- ${c.name}: ${c.text}`),
  ];
  return new Response(`${lines.join('\n')}\n`, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
