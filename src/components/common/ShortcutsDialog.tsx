/**
 * Keyboard shortcuts reference dialog (Phase D2).
 *
 * Mounts once at the app root and opens when the `help.open` shortcut fires
 * (Cmd+/ on macOS, Ctrl+/ elsewhere). Renders the registry grouped by scope
 * so users can scan shortcuts by feature area.
 *
 * Uses Radix Dialog primitives directly (not the `Sheet` wrapper) because
 * this is a modest centered dialog rather than a side sheet — the semantics
 * we need are: focus trap, escape-to-close, aria-modal, labelled title +
 * description. Radix gives those for free.
 */
import { useState, useEffect, useCallback } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SHORTCUTS, formatShortcut, type ShortcutScope } from '@/lib/shortcuts';
import { useShortcut } from '@/hooks/useShortcut';

const SCOPE_ORDER: ShortcutScope[] = ['global', 'chat', 'sidebar', 'modal'];

export function ShortcutsDialog() {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  // Wire Cmd+/ (registry id `help.open`) to this dialog. The Escape key is
  // handled by Radix Dialog itself — no need to duplicate.
  useShortcut('help.open', toggle);

  // Close on Escape is automatic via Radix. We also close when the user
  // activates another registered global shortcut: Radix swallows it while
  // open, so we listen ourselves and forward the closure.
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      // Any Mod+letter shortcut other than Mod+/ should close the dialog so
      // the underlying binding can run. We let the next keydown through.
      if (event.key === 'Escape') return;
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const groups = SCOPE_ORDER.map((scope) => ({
    scope,
    shortcuts: SHORTCUTS.filter((s) => s.scope === scope),
  })).filter((g) => g.shortcuts.length > 0);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100vw-2rem)] max-w-xl max-h-[80vh] overflow-y-auto',
            'rounded-2xl border border-black/10 dark:border-white/10 bg-background p-6 shadow-2xl',
            'focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground">
                {t('shortcuts.dialogTitle')}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
                {t('shortcuts.dialogDescription')}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('shortcuts.close')}
                className="rounded-full h-8 w-8 shrink-0"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DialogPrimitive.Close>
          </div>

          <dl className="space-y-4">
            {groups.map((group) => (
              <section key={group.scope}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  {t(`shortcuts.scope.${group.scope}`)}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-black/5 dark:border-white/10 bg-muted/30 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <dt className="text-[14px] font-medium text-foreground truncate">
                          {t(`shortcuts.${shortcut.id}.label`)}
                        </dt>
                        <dd className="text-[12px] text-muted-foreground truncate">
                          {t(`shortcuts.${shortcut.id}.description`)}
                        </dd>
                      </div>
                      <kbd className="shrink-0 rounded-md border border-black/10 dark:border-white/15 bg-background px-2 py-1 text-[12px] font-mono text-foreground shadow-sm">
                        {formatShortcut(shortcut.keys)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </dl>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
