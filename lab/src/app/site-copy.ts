export const LAB_HERO_COPY = {
  support:
    'Indie developer building game tools and systems for fun shared experiences online and off.',
  primaryAction: { href: 'https://warp.undef.games', label: 'Explore WARP' },
  secondaryAction: { href: '#projects', label: 'View projects' },
  statusLabel: 'Shared play, digital and physical.',
} as const

export const LAB_PROJECTS = [
  {
    className: 'product-link--warp',
    description:
      'The flagship route: a live alpha platform for TradeWars runtime, automation, and operator tooling.',
    href: 'https://warp.undef.games',
    label: 'TradeWars: WARP Agent Runtime Platform',
    tag: 'warp',
  },
  {
    className: 'product-link--dice',
    description:
      'Dice and table tools built to keep groups moving quickly at the table and on the network.',
    href: 'https://undefdice.com',
    label: 'Undef Dice',
    tag: 'dice',
  },
  {
    className: 'product-link--taybols',
    description:
      'Smaller experiments, generators, and odd little game utilities with room to become bigger systems.',
    href: 'https://taybols.undef.games',
    label: 'Taybols',
    tag: 'taybols',
  },
] as const

export const LAB_SECTIONS = {
  signal: {
    kicker: 'Interactive field',
    title: 'Shared play needs strong systems underneath it.',
    body:
      'The site stays active and readable while pointing people toward the products, tools, and experiments that make play easier to share online and off.',
  },
  projects: {
    kicker: 'Live routes',
    title: 'Projects built to be used, watched, and played with.',
  },
  warp: {
    kicker: 'Flagship route',
    title: 'TradeWars: WARP Agent Runtime Platform.',
    body:
      'A live alpha platform for runtime control, automation, and operator tooling around TradeWars.',
    linkLabel: 'Explore WARP',
    href: 'https://warp.undef.games',
  },
  dice: {
    kicker: 'Table tools',
    title: 'Undef Dice keeps shared play moving.',
    body:
      'Fast dice and lightweight utilities for groups who want clearer game moments online and off.',
    linkLabel: 'Open Undef Dice',
    href: 'https://undefdice.com',
  },
  taybols: {
    kicker: 'Small experiments',
    title: 'Taybols keeps the smaller ideas in circulation.',
    body:
      'Generators, utility tools, and playful experiments that can grow into finished systems.',
    linkLabel: 'Open Taybols',
    href: 'https://taybols.undef.games',
  },
  identity: {
    kicker: 'Company baseline',
    title: 'Good systems should make shared play easier to reach.',
    body:
      'undef games builds the technical side of play so people can gather, operate, and have fun across digital and physical spaces.',
  },
  closing: {
    kicker: 'undef.games',
    title: 'Built for people to play together.',
    action: 'Back to top',
  },
} as const
