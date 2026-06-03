import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function EntityTooltip({ entity, children }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const tooltipRef = useRef(null);

    useEffect(() => {
        if (showTooltip && triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            let top = triggerRect.top - tooltipRect.height - 8;
            let left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

            // Adjust if tooltip goes off-screen
            if (top < 0) {
                top = triggerRect.bottom + 8;
            }
            if (left < 0) {
                left = 8;
            } else if (left + tooltipRect.width > window.innerWidth) {
                left = window.innerWidth - tooltipRect.width - 8;
            }

            setTooltipPos({ top, left });
        }
    }, [showTooltip]);

    return (
        <>
            <span
                ref={triggerRef}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="cursor-help"
            >
                {children}
            </span>

            <AnimatePresence>
                {showTooltip && (
                    <motion.div
                        ref={tooltipRef}
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        style={{
                            position: 'fixed',
                            top: `${tooltipPos.top}px`,
                            left: `${tooltipPos.left}px`,
                            zIndex: 50,
                        }}
                        className="max-w-xs rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-lg"
                    >
                        <div className="font-semibold text-slate-200">{entity.field_name}</div>
                        <div className="mt-1.5 text-slate-100">{entity.text}</div>
                        <div className="mt-1.5 text-xs text-slate-400">
                            Vị trí: {entity.start}–{entity.end}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

