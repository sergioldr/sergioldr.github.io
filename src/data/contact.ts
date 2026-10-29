// How to reach Sergio: in the game's menu and in the plain-HTML version of the landing.

export interface ContactLink {
  name: string;
  text: string;
  href: string;
}

export const contact: ContactLink[] = [
  { name: 'Email', text: 'sergio@referentsoftware.com', href: 'mailto:sergio@referentsoftware.com' },
  { name: 'LinkedIn', text: 'linkedin.com/in/sergio-lozano', href: 'https://linkedin.com/in/sergio-lozano' },
  { name: 'GitHub', text: 'github.com/sergioldr', href: 'https://github.com/sergioldr' },
];
