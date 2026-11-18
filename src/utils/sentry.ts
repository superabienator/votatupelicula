import * as Sentry from '@sentry/react';

/**
 * Inicializa Sentry en el cliente únicamente si existe VITE_SENTRY_DSN
 * (protege cuota gratuita con tracesSampleRate=0.1 y respeta RGPD/LOPDGDD).
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim() || '';

  if (!dsn || import.meta.env.MODE === 'test') {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  });
}
