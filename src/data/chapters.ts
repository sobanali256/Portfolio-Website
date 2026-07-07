import type Lenis from 'lenis';

export interface Chapter {
  id: string;
  number: string;
  name: string;
}

// Single source of truth for section ids/numbers/order.
// Navbar and ChapterProgress both render from this list.
export const chapters: Chapter[] = [
  { id: 'hero', number: '01', name: 'The Spark' },
  { id: 'about', number: '02', name: 'The Origin' },
  { id: 'skills', number: '03', name: 'The Toolkit' },
  { id: 'projects', number: '04', name: 'The Builds' },
  { id: 'experience', number: '05', name: 'The Field' },
  { id: 'contact', number: '06', name: 'Next Chapter' },
];

export function scrollToChapter(id: string, lenis?: Lenis | null) {
  const element = document.getElementById(id);
  if (element) {
    const offset = 56; // Navbar height
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = element.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    if (lenis) {
      lenis.scrollTo(offsetPosition);
    } else {
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
