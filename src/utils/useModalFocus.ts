import { useEffect, useRef, type RefObject } from 'react';

/**
 * Gestiona el foco accesible de un modal:
 * - Al abrir, guarda el elemento que tenía el foco y enfoca el contenedor del diálogo.
 * - Al cerrar, devuelve el foco al elemento disparador si sigue en el DOM.
 */
export function useModalFocus(
  open: boolean,
  dialogRef: RefObject<HTMLElement | null>
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const frame = window.requestAnimationFrame(() => {
        dialogRef.current?.focus({ preventScroll: true });
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (previousFocusRef.current && previousFocusRef.current.isConnected) {
      previousFocusRef.current.focus({ preventScroll: true });
      previousFocusRef.current = null;
    }
  }, [open, dialogRef]);
}
