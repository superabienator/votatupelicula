import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';

vi.mock('../services/api', async () => {
  const { sandboxBackend } = await import('../services/sandboxBackend');
  return {
    IS_SANDBOX_MODE: true,
    cinemaApi: sandboxBackend,
  };
});

describe('Interfaz VotaTuPelícula y educación cívica', () => {
  it('muestra la cartelera, abre el modal "¿Cómo funciona tu voto?" y no usa almacenamiento local', async () => {
    const localGetSpy = vi.spyOn(Storage.prototype, 'getItem');
    const localSetSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(<App />);

    // Espera a que carguen las películas publicadas
    await waitFor(() => {
      expect(screen.getByText('Interstellar')).toBeInTheDocument();
    });

    // El acceso de administración no aparece en el menú público
    expect(
      screen.queryByRole('button', { name: /Profesorado|Admin/i })
    ).not.toBeInTheDocument();

    // Abrir modal didáctico obligatorio
    fireEvent.click(screen.getByRole('button', { name: /¿Cómo funciona tu voto\?/i }));
    expect(screen.getByText(/1\. Mayoría Simple/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Voto Aprobatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Voto Preferencial/i)).toBeInTheDocument();

    // Cerrar modal didáctico
    fireEvent.click(screen.getByRole('button', { name: /Cerrar explicación/i }));

    // Seleccionar 3 películas mediante botones 1º, 2º, 3º
    const firstButtons = screen.getAllByRole('button', { name: /^1º/ });
    const secondButtons = screen.getAllByRole('button', { name: /^2º/ });
    const thirdButtons = screen.getAllByRole('button', { name: /^3º/ });

    fireEvent.click(firstButtons[0]);
    fireEvent.click(secondButtons[1]);
    fireEvent.click(thirdButtons[2]);

    // El botón de "Revisar Entrada de Cine y Votar" queda habilitado
    const reviewBtn = screen.getByRole('button', {
      name: /Revisar Entrada de Cine y Votar/i,
    });
    expect(reviewBtn).toBeEnabled();
    fireEvent.click(reviewBtn);

    // Se muestra el modal animado estilo Entrada de Cine
    await waitFor(() => {
      expect(screen.getByText('Tu Entrada de Cine')).toBeInTheDocument();
    });

    // Confirmar ausencia total de lectura/escritura en localStorage/sessionStorage
    expect(localGetSpy).not.toHaveBeenCalled();
    expect(localSetSpy).not.toHaveBeenCalled();

    localGetSpy.mockRestore();
    localSetSpy.mockRestore();
  });

  it('abre el panel de administración al entrar en /admin', async () => {
    window.history.pushState({}, '', '/admin');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Acceso protegido')).toBeInTheDocument();
    });

    window.history.pushState({}, '', '/');
  });
});
