import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

interface FeedbackStateProps {
  state: 'loading' | 'empty' | 'error';
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function FeedbackState({ state, title, description, action }: FeedbackStateProps) {
  const icon = state === 'loading'
    ? <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
    : state === 'error'
      ? <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      : <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden="true" />;

  // Errors interrupt (`role="alert"` => assertive); loading/empty stay polite
  // so screen readers finish whatever they're already narrating.
  const role = state === 'error' ? 'alert' : 'status';
  const ariaLive = state === 'error' ? 'assertive' : 'polite';
  const ariaBusy = state === 'loading' ? true : undefined;

  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-busy={ariaBusy}
      className="flex flex-col items-center justify-center py-8 text-center"
    >
      <div className="mb-3">{icon}</div>
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
