export const siteConfig = {
  name: 'Natalia Isakova',
  author: { name: 'Natalia Isakova', role: 'Product Designer & Builder', email: 'nisakova.info@gmail.com' },
  action: { label: 'Get in touch', href: '#contact' },
  socials: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/ux-natalia-isakova/' }],
};
export const navigation = [{ label: 'Work', href: '/work/' }, { label: 'About', href: '/about/' }];
export const workNavigation = [
  { label: 'All work', href: '/work/' },
  { label: 'User research', href: '/work/?expertise=ux-research' },
  { label: 'UX/UI design', href: '/work/?expertise=ui-design' },
  { label: 'Marketing design', href: '/fraudscore/' },
];
export const projectPresentation: Record<string, { tint: string }> = {
  'mafia-bot-mini-app': { tint: 'var(--tint-forest)' },
  tickeron: { tint: 'var(--tint-sage)' },
  myhospital: { tint: 'var(--tint-lime)' },
  kidswearcycle: { tint: 'var(--tint-sage)' },
  'ijet-media': { tint: 'var(--tint-forest)' },
  fraudscore: { tint: 'var(--tint-lime)' },
};
