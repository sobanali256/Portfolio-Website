import type Lenis from 'lenis';

export interface Chapter {
  id: string;
  number: string;
  name: string;
}

// Single source of truth for section ids/numbers/order.
// The Navbar renders from this list; each section's <SectionHeader> uses the same number.
export const chapters: Chapter[] = [
  { id: 'about', number: '01', name: 'About' },
  { id: 'work', number: '02', name: 'Work' },
  { id: 'experience', number: '03', name: 'Experience' },
  { id: 'stack', number: '04', name: 'Stack' },
  { id: 'contact', number: '05', name: 'Contact' },
];

export const NAV_HEIGHT = 64;

export function scrollToChapter(id: string, lenis?: Lenis | null) {
  if (id === 'top') {
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  const element = document.getElementById(id);
  if (!element) return;
  const top = element.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT;
  if (lenis) lenis.scrollTo(top);
  else window.scrollTo({ top, behavior: 'smooth' });
}
