"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

// Global toast state
let addToastFn: ((message: string, type: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "success") {
  addToastFn?.(message, type);
}

const ICONS = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const STYLES = {
  success: { border: 'rgba(72,199,142,0.35)',  icon: '#48C78E', bg: 'rgba(72,199,142,0.10)' },
  error:   { border: 'rgba(252,110,110,0.35)', icon: '#FC6E6E', bg: 'rgba(252,110,110,0.10)' },
  warning: { border: 'rgba(255,183,77,0.35)',  icon: '#FFB74D', bg: 'rgba(255,183,77,0.10)' },
  info:    { border: 'rgba(44,143,255,0.35)',  icon: '#2C8FFF', bg: 'rgba(44,143,255,0.10)' },
};

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const style = STYLES[item.type];
  const Icon  = ICONS[item.type];

  useEffect(() => {
    // Trigger enter animation
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 3s
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(item.id), 300);
    }, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [item.id, onRemove]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 12,
        background: 'rgba(4,12,32,0.94)',
        border: `1px solid ${style.border}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.50)',
        minWidth: 220,
        maxWidth: 340,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(24px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ width: 18, height: 18, flexShrink: 0, background: style.bg, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ width: 12, height: 12, color: style.icon }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(220,235,255,0.90)', flex: 1, lineHeight: 1.4 }}>
        {item.message}
      </span>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(item.id), 300); }}
        style={{ color: 'rgba(150,180,255,0.40)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0, display: 'flex' }}
      >
        <X style={{ width: 12, height: 12 }} />
      </button>
    </div>
  );
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const counter = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = `toast_${++counter.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Register global fn
  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 99998,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
      alignItems: 'flex-end',
    }}>
      {toasts.map(t => (
        <ToastItem key={t.id} item={t} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
}
