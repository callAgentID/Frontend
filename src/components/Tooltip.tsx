"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({ content, children, placement = "top", delay = 400 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return;
      let x = 0, y = 0;
      switch (placement) {
        case "top":    x = r.left + r.width / 2; y = r.top - 8;            break;
        case "bottom": x = r.left + r.width / 2; y = r.bottom + 8;         break;
        case "left":   x = r.left - 8;            y = r.top + r.height / 2; break;
        case "right":  x = r.right + 8;           y = r.top + r.height / 2; break;
      }
      setCoords({ x, y });
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  const transformMap = {
    top:    "translate(-50%, -100%)",
    bottom: "translate(-50%, 0%)",
    left:   "translate(-100%, -50%)",
    right:  "translate(0%, -50%)",
  };

  return (
    <>
      {/* Inline wrapper — inherits layout from its child */}
      <span
        ref={wrapRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: 'inline-flex', alignItems: 'inherit', maxWidth: '100%' }}
      >
        {children}
      </span>

      {mounted && visible && createPortal(
        <div style={{
          position: 'fixed',
          left: coords.x,
          top: coords.y,
          transform: transformMap[placement],
          zIndex: 99999,
          pointerEvents: 'none',
        }}>
          <div style={{
            background: 'rgba(4,12,32,0.96)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(220,235,255,0.90)',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: 1.45,
            boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
            minWidth: 60,
            maxWidth: 220,
            width: 'max-content',
          }}>
            {content}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
