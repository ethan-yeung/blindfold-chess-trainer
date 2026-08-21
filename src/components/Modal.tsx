'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
    const titleId = useId();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!mounted) return null;

    return createPortal(
        <div
            aria-hidden={!open}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
        >
            <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" onClick={onClose} />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`relative z-10 max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate bg-surface p-6 shadow-xl transition-all duration-200 ${open
                        ? 'translate-y-0 scale-100 opacity-100'
                        : 'translate-y-3 scale-95 opacity-0'
                    }`}
            >
                <div className="flex items-start justify-between">
                    <h2 id={titleId} className="font-display text-xl font-semibold text-parchment">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-md px-2 font-mono text-muted transition hover:text-brass focus:outline-none focus-visible:ring-2 focus-visible:ring-brass"
                    >
                        ✕
                    </button>
                </div>

                <div className="mt-4">{children}</div>
            </div>
        </div>,
        document.body,
    );
}