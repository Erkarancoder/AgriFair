import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto bg-stone-950/85 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div className="flex min-h-full items-start justify-center p-3 sm:p-6 pt-8 sm:pt-12 pb-16 text-center sm:text-left">
        <div
          className={`relative w-full ${maxWidth} bg-white rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden transform transition-all text-left animate-in zoom-in-95 duration-200 my-auto sm:my-0`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-stone-100 bg-[#faf9f5]">
            <h3 id="modal-title" className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-200/70 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-600"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-5 sm:px-6 py-5 max-h-[calc(85vh-90px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

