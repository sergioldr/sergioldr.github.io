export type RoleId = 'referent' | 'mango' | 'telefonica-5gnow' | 'telefonica-aura' | 'nutrilieve' | 'freelance';

export interface Role {
  /** Stable key, used by the Agent HQ game to point at a role. */
  id: RoleId;
  company: string;
  title: string;
  period: string;
  place: string;
  /** Year on its display case in the Archive and on its tab on the experience page. */
  since: number;
  /** Short name for its tab on the experience page. */
  short: string;
  points: string[];
  stack: string[];
}

export const roles: Role[] = [
  {
    id: 'referent',
    company: 'Referent Software',
    short: 'Referent Software',
    since: 2025,
    title: 'Founder',
    period: '12/2025 — Present',
    place: 'Burgos (remote)',
    points: [
      "Five-person AI software company building an AI layer over companies' closed systems (custom ERPs, TMS, WMS) that answers questions about their data, cites the source and does the follow-up work.",
      'Engineering runs AI-first. Every task starts as a GitHub issue and ends as a pull request with CI, and nothing merges without a human review. In one week that meant 30+ merged PRs across five repos.',
      'Built the onboarding, billing (enterprise plans and pay-as-you-go token credits) and 20+ OAuth integrations of referent.app, our multi-tenant SaaS.',
      'Built a pipeline that watches PLACSP and seven regional procurement platforms, has Claude analyse each tender and posts the ones that fit to Discord.',
    ],
    stack: ['Astro', 'React 19', 'Zustand', 'Vercel AI SDK', 'Hono', 'Cloudflare Workers', 'PostgreSQL', 'Python', 'Docker', 'Coolify', 'Claude Code'],
  },
  {
    id: 'mango',
    company: 'Mango · via InnoIT Consulting',
    short: 'Mango',
    since: 2022,
    title: 'Senior Frontend Developer',
    period: '04/2022 — Present',
    place: 'Barcelona (remote)',
    points: [
      "Led the payments part of Mango's checkout through its move from a 20-year-old JSP monolith to Next.js, with Adyen, Checkout.com, Worldline and iyzico as PSPs plus PayPal, Klarna, Apple Pay and Google Pay.",
      "Built a custom card payment form from scratch and took part in Mango's PCI DSS audits.",
      'Implemented native 3DS2 with Adyen and standard 3DS with the other PSPs, and integrated Signifyd for fraud detection, device fingerprinting and order traceability.',
      'Work with product from discovery, validating features with A/B tests in Optimizely, such as an AI-driven ordering of payment methods that tested positive.',
      'Part of the team behind the Next.js and Turborepo monorepo on AWS. Lighthouse went from 20–40 to 100, “poor” Core Web Vitals URLs dropped to zero and Google crawl requests rose 3,620%.',
      'Releases moved from every two weeks to continuous deployment. Mentored several junior and mid-level developers.',
    ],
    stack: ['TypeScript', 'React', 'Next.js', 'Turborepo', 'GraphQL', 'CSS Modules', 'SASS', 'Jest', 'Optimizely', 'Webpack', 'Vite', 'Turbopack', 'AWS', 'Jenkins'],
  },
  {
    id: 'telefonica-5gnow',
    company: 'Telefónica · 5Gnow',
    short: 'Telefónica 5Gnow',
    since: 2021,
    title: 'Senior Frontend Developer',
    period: '11/2021 — 04/2022',
    place: 'Madrid (remote)',
    points: [
      'Real-time dashboard to manage 5G and IoT SIMs for enterprise clients, part of 5G for Industry 4.0.',
      'Graph-based monitoring and control screens for networks of devices, built with domain-driven design and tested in Cypress and Jest.',
    ],
    stack: ['React', 'TypeScript', 'MUI', 'Storybook', 'Formik', 'Cypress', 'Webpack', 'Docker', 'Jenkins'],
  },
  {
    id: 'telefonica-aura',
    company: 'Telefónica · Aura and Living Apps',
    short: 'Telefónica Aura',
    since: 2020,
    title: 'Full-Stack Developer',
    period: '12/2020 — 11/2021',
    place: 'Madrid (remote)',
    points: [
      "Interactive TV apps for Movistar+ and Movistar Home, with voice dialogs through Aura, Telefónica's virtual assistant.",
      'A shared TV component library reused across several apps.',
    ],
    stack: ['TypeScript', 'React', 'Node.js', 'Express', 'Rollup', 'Jest', 'Azure', 'GitHub CI/CD'],
  },
  {
    id: 'nutrilieve',
    company: 'Nutrilieve',
    short: 'Nutrilieve',
    since: 2019,
    title: 'Full-Stack Developer',
    period: '12/2019 — 12/2020',
    place: 'Barcelona (remote)',
    points: ['Built a cross-platform nutrition app for cancer patients, with a Dialogflow chatbot for personalised advice.'],
    stack: ['JavaScript', 'Next.js', 'Node.js', 'Firebase'],
  },
  {
    id: 'freelance',
    company: 'Freelance',
    short: 'Freelance',
    since: 2018,
    title: 'Software Developer',
    period: '02/2018 — 09/2023',
    place: 'Burgos (remote, part-time)',
    points: [
      'React web apps, database migrations and Shopify storefront work for clients.',
      'Web3 projects in a two-person team, building admin panels with wallet integrations, token analytics and backend APIs, plus deployments and CI/CD.',
    ],
    stack: ['Next.js', 'TypeScript', 'Solidity', 'Ethers.js', 'PostgreSQL', 'AWS'],
  },
];

export const education = [
  { degree: "Official Master's Degree in Mobile Application Development", school: 'Universitat Oberta de Catalunya', years: '2017 — 2018' },
  { degree: "Bachelor's Degree in Multimedia", school: 'Universitat Politècnica de Catalunya', years: '2013 — 2017' },
];

export const languages = [
  { name: 'Spanish', level: 'Native' },
  { name: 'English', level: 'Full professional proficiency' },
];
