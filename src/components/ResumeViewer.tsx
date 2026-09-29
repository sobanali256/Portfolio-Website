import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Download, X } from 'lucide-react';
import { useLenis } from 'lenis/react';
import { profile } from '../data/content';
import preview from '../assets/resume-preview.webp';
import { OpenResume } from './resumeContext';

// Desktop browsers render PDFs inline; Android Chrome can't, and iOS shows a static,
// unzoomable first page, so touch devices get a pre-rendered image of the page instead.
const canEmbedPdf = () =>
  navigator.pdfViewerEnabled === true && !window.matchMedia('(pointer: coarse)').matches;

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [embed, setEmbed] = useState(false);
  const lenis = useLenis();

  const open = useCallback(() => {
    setEmbed(canEmbedPdf());
    setIsOpen(true);
  }, []);

  // State is the source of truth; the dialog follows it. The native `close` event is queued
  // asynchronously (and can be deferred in background tabs), so nothing waits on it.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (!isOpen) {
      if (d.open) d.close();
      return;
    }
    if (!d.open) {
      d.showModal();
      // showModal focuses the first focusable element (Download); start on Close instead.
      closeButton.current?.focus();
    }
    lenis?.stop();
    document.body.style.overflow = 'hidden';
    return () => {
      lenis?.start();
      document.body.style.overflow = '';
    };
  }, [isOpen, lenis]);

  const close = () => setIsOpen(false);

  return (
    <OpenResume.Provider value={open}>
      {children}

      <dialog
        ref={dialog}
        aria-label="Résumé"
        // Esc fires `cancel` synchronously; route it through state like every other close.
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClose={close}
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        onClick={(e) => e.target === e.currentTarget && close()}
        data-lenis-prevent
        className="m-auto h-[min(92dvh,1120px)] max-h-none w-[min(94vw,880px)] max-w-none overflow-hidden border border-rule-strong bg-paper p-0 text-ink shadow-2xl backdrop:bg-paper/75 backdrop:backdrop-blur-sm"
      >
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-full flex-col"
          >
            <header className="flex items-center justify-between gap-4 border-b border-rule py-2 pl-5 pr-2">
              <p className="label truncate">
                Appendix A <span className="mx-1.5 text-rule-strong">/</span> Résumé
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <a
                  href={profile.resume}
                  download="Soban-Ali-Resume.pdf"
                  className="flex h-10 items-center gap-2 rounded-full px-3 text-[13.5px] text-ink transition-colors duration-200 hover:bg-paper-2"
                >
                  <Download size={15} strokeWidth={1.7} />
                  Download
                </a>
                <button
                  type="button"
                  ref={closeButton}
                  onClick={close}
                  aria-label="Close résumé"
                  className="grid size-10 cursor-pointer place-items-center rounded-full text-muted transition-colors duration-200 hover:bg-paper-2 hover:text-ink"
                >
                  <X size={18} strokeWidth={1.6} />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 bg-paper-2">
              {embed ? (
                <iframe
                  src={`${profile.resume}#toolbar=0&navpanes=0&view=FitH`}
                  title={`${profile.name}’s résumé`}
                  className="size-full"
                />
              ) : (
                <div className="h-full overflow-y-auto overscroll-contain p-3 sm:p-6">
                  <img
                    src={preview}
                    width={1275}
                    height={1650}
                    alt={`${profile.name}’s résumé. Download the PDF for selectable text and working links.`}
                    className="mx-auto h-auto w-full max-w-[820px] border border-rule bg-white"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </dialog>
    </OpenResume.Provider>
  );
}
