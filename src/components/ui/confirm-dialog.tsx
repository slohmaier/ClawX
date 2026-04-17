/**
 * ConfirmDialog - In-DOM confirmation dialog (replaces window.confirm)
 * Keeps focus within the renderer to avoid Windows focus loss after native dialogs.
 */
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  onError?: (error: unknown) => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  onError,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset confirming when dialog closes (during render to avoid setState-in-effect)
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setConfirming(false);
    }
  }

  useEffect(() => {
    if (open) {
      previousActiveElementRef.current = (document.activeElement as HTMLElement) ?? null;
      if (cancelRef.current) cancelRef.current.focus();
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus();
      previousActiveElementRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !confirming) {
      e.preventDefault();
      onCancel();
      return;
    }
    // Minimal focus trap: cycle between Cancel and Confirm buttons
    if (e.key === 'Tab') {
      const active = document.activeElement;
      if (e.shiftKey && active === cancelRef.current) {
        e.preventDefault();
        confirmRef.current?.focus();
      } else if (!e.shiftKey && active === confirmRef.current) {
        e.preventDefault();
        cancelRef.current?.focus();
      }
    }
  };

  const handleConfirm = () => {
    if (confirming) return;
    const result = onConfirm();
    if (result instanceof Promise) {
      setConfirming(true);
      result.catch((error) => {
        if (onError) {
          onError(error);
        }
      }).finally(() => {
        setConfirming(false);
      });
    }
  };

  return (
    // Dialog wrapper: `role="dialog"` makes this an ARIA widget, and the
    // onKeyDown handler captures Escape bubbling from any descendant. This is
    // the standard modal-dialog pattern; the lint rule can't see that the
    // role upgrades the div to an interactive widget.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onKeyDown={handleKeyDown}
    >
      <div
        className={cn(
          'mx-4 max-w-md rounded-lg border bg-card p-6 shadow-lg',
          'focus:outline-none'
        )}
        tabIndex={-1}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            variant="outline"
            onClick={onCancel}
            disabled={confirming}
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
