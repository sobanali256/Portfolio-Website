import { useState, useEffect } from 'react';

export default function useActiveSection(ids: string[]): string {
  const [activeSection, setActiveSection] = useState(ids[0] ?? '');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      ids.forEach(id => {
        const section = document.getElementById(id);
        if (section) {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(id);
          }
        }
      });
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [ids.join(',')]);

  return activeSection;
}
