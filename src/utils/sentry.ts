import * as Sentry from '@sentry/react';

declare global {
  interface Window {
    __triggerSentryTestError?: () => void;
  }
}

/**
 * Inicializa Sentry en el cliente únicamente si existe VITE_SENTRY_DSN
 * y nunca envía PII por defecto (RGPD / LOPDGDD).
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim() || '';

  // Trigger temporal para verificar la conexión desde la consola del navegador
  window.__triggerSentryTestError = triggerSentryTestError;

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

/**
 * Función temporal de prueba para validar que Sentry recibe eventos en producción.
 */
export function triggerSentryTestError(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim() || '';
  if (!dsn) {
    console.warn('[Sentry] VITE_SENTRY_DSN no está configurado; no se enviará el evento de prueba.');
    return;
  }
  const err = new Error('Sentry test error · VotaTuPelícula');
  Sentry.captureException(err);
  console.info('[Sentry] Error de prueba enviado a Sentry.');
}
