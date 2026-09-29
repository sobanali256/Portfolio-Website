import React, { createContext, useContext } from 'react';

// Kept apart from ResumeViewer.tsx so hot-reloading the viewer doesn't mint a new context
// that already-mounted links never see.
export const OpenResume = createContext<(() => void) | null>(null);

/**
 * Click handler for any link to the résumé: a plain click opens the in-page viewer, while
 * modified clicks (new tab, new window) — or a missing viewer — fall through to the raw PDF.
 */
export function useOpenResume() {
  const open = useContext(OpenResume);
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!open || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open();
  };
}
