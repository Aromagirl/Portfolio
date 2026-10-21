export const siteConfig = {
  name: 'Natalia Isakova',
  author: { name: 'Natalia Isakova', role: 'UX/UI & Interactive designer', email: 'nisakova.info@gmail.com' },
  action: { label: 'Get in touch', href: 'mailto:nisakova.info@gmail.com' },
  socials: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/ux-natalia-isakova/' }],
};
export const navigation = [{ label: 'Work', href: '/work/' }, { label: 'About', href: '/about/' }];
export const workNavigation = [
  { label: 'All work', href: '/work/' },
  { label: 'User research', href: '/user-research/' },
  { label: 'UX/UI design', href: '/uxui-design/' },
  { label: 'Marketing design', href: '/marketing-design/' },
];
export const projectPresentation: Record<string, { tint: string; cover?: string }> = {
  safeclick: { tint: '#e1ece8' },
  'mafia-bot-mini-app': { tint: '#e8e1ed' },
  tickeron: { tint: '#e4e8f3', cover: '/images/projects/home/04.webp' },
  myhospital: { tint: '#efe5f2', cover: '/images/projects/home/03.webp' },
  kidswearcycle: { tint: '#e5edda', cover: '/images/projects/home/02.webp' },
  'ijet-media': { tint: '#f5e5d3', cover: '/images/projects/ijet-media/02.webp' },
  'marketing-design': { tint: '#e6e4f2', cover: '/images/projects/fraudscore/cover.png' },
};
