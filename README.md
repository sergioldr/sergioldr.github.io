# sergioldr.github.io

Personal portfolio of **Sergio Lozano del Río**, Senior Frontend Engineer (React, TypeScript).

Live at **https://sergioldr.github.io**

## Stack

- [Astro](https://astro.build) with zero client framework. Every page ships as static HTML and CSS.
- Vanilla TypeScript only where needed: Agent HQ.
- Agent HQ is the landing page (`/`): a full-screen pixel-art game on a canvas about how an AI agent harness works. All the art is drawn in code, the interface included, and the chiptune music and sound effects are synthesized with the Web Audio API: no image or audio files.
- Self-hosted Pixelify Sans and Press Start 2P fonts via Fontsource.
- Deployed to GitHub Pages with the official `withastro/action` workflow.

## Design

The landing is Agent HQ, filling the screen. It opens on a title screen with no dialog: H.E.R.B.I.E. floats between two choices, the experience or the game. Its HTML interface (HUD, dialog, windows) is drawn like the plaques on the office walls: nine-slice pixel frames, icons and the cursor come from ASCII patterns in `ui/pixels.ts`, and every size is measured in pixels of the game. Without JavaScript the page shows the same story as plain HTML.

The full experience (`/experience`) speaks the same pixel language: each role is a window like its display case in the Archive, with the year and company on the tab and the record on paper. `src/styles/global.css` holds the interface both pages share (buttons, windows, paper) and `agent-hq.css` adds the game's own pieces.

- Two buttons sit under the name: **Download CV** (`public/sergio-lozano-cv.pdf`, replace the file to update it) and **Ask your AI**, a menu that opens Claude or ChatGPT with a prompt to read `/experience.md`, the same record as Markdown, generated from `experience.ts` at build time.
- The page works without JavaScript. `scripts/experience.ts` only adds the extras: the menu closes on a click outside or Escape, and on a first visit H.E.R.B.I.E. waves from a window announcing Ask your AI (remembered in `localStorage`).

- On a touch screen the game talks about taps instead of keys: H.E.R.B.I.E.'s controls line, the menu's "How to play" and the game's accessible label.
- `prefers-reduced-motion` turns every animation off.

## Structure

```
src/
  data/        experience.ts (roles, education, languages), contact.ts
               agents.ts, harness.ts, missions.ts, archive.ts (Agent HQ content)
  layouts/     Base.astro
  pages/       index.astro (Agent HQ), experience.astro, experience.md.ts
  scripts/
    agent-hq/  the game: engine/, sprites/, world/, core/, missions/, ui/, audio/
    experience.ts  the experience page's menu and announcement
  styles/      global.css (the shared pixel interface), agent-hq.css (the game)
scripts/
  agent-hq-smoke.ts  checks the music and plays mission 1 without a browser
```

Edit `src/data/experience.ts` to update roles. Both pages read from it: Agent HQ shows each role in its Archive.

## Run locally

```bash
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # outputs to dist/
pnpm check     # types
pnpm test      # Agent HQ smoke bot
```
