"use client";

import { useEffect } from "react";

// ── Base overlay ──────────────────────────────────────────────────────────────

type ModalProps = {
  children: React.ReactNode;
  onClose: () => void;
};

function Modal({ children, onClose }: ModalProps) {
  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-sm mx-4 p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ── ConfirmDialog ────────────────────────────────────────────────────────────

type ConfirmDialogProps = {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  message,
  confirmLabel = "確認",
  cancelLabel = "キャンセル",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal onClose={onCancel}>
      <p className="text-base font-medium mb-6 text-center leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <button
          className="btn btn-secondary flex-1"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          className="btn flex-1 bg-[rgba(255,95,95,0.15)] text-[var(--red)] border border-[var(--red)] hover:bg-[rgba(255,95,95,0.25)] transition-colors"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ── AlertDialog ──────────────────────────────────────────────────────────────

type AlertDialogProps = {
  message: string;
  okLabel?: string;
  onClose: () => void;
};

export function AlertDialog({
  message,
  okLabel = "OK",
  onClose,
}: AlertDialogProps) {
  return (
    <Modal onClose={onClose}>
      <p className="text-base font-medium mb-6 text-center leading-relaxed">{message}</p>
      <button className="btn btn-primary w-full" onClick={onClose}>
        {okLabel}
      </button>
    </Modal>
  );
}
