import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '../App';
import { I18nProvider } from '../i18n/I18nContext';

vi.mock('../services/api', async () => {
  const { sandboxBackend } = await import('../services/sandboxBackend');
  return {
    IS_SANDBOX_MODE: true,
    cinemaApi: sandboxBackend,
  };
});

function renderApp() {
  return render(
    <I18nProvider>
      <App />
    </I18nProvider>
  );
}

describe('Interfaz VotaTuPelícula, idiomas, tráilers y educación cívica', () => {
  it('elimina buscador/categorías, traduce la UI y tags en ES/VA/EN, abre el reproductor de tráiler y no usa almacenamiento local', async () => {
    const localGetSpy = vi.spyOn(Storage.prototype, 'getItem');
    const localSetSpy = vi.spyOn(Storage.prototype, 'setItem');

    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Interstellar')).toBeInTheDocument();
    });

    // No existe buscador ni filtro de categorías ni botón admin público
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Todas' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Profesorado|Admin/i })
    ).not.toBeInTheDocument();

    // Etiqueta inicial en Castellano
    expect(screen.getByText('Viaje espacial')).toBeInTheDocument();

    // Cambiar a Valencià (VA)
    fireEvent.click(screen.getByRole('button', { name: 'VA' }));
    expect(screen.getByRole('button', { name: /Com funciona el teu vot\?/i })).toBeInTheDocument();
    expect(screen.getByText('Viatge espacial')).toBeInTheDocument();

    // Cambiar a Inglés (EN)
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: /How does your vote work\?/i })).toBeInTheDocument();
    expect(screen.getByText('Space travel')).toBeInTheDocument();

    // Volver a Castellano (ES) y abrir reproductor de tráiler integrado
    fireEvent.click(screen.getByRole('button', { name: 'ES' }));
    const trailerButtons = screen.getAllByRole('button', { name: /Ver tráiler/i });
    fireEvent.click(trailerButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Reproductor de Tráiler')).toBeInTheDocument();
      expect(screen.getByTitle(/Reproductor de Tráiler/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Cerrar reproductor de tráiler/i }));

    // Abrir modal didáctico obligatorio
    fireEvent.click(screen.getByRole('button', { name: /¿Cómo funciona tu voto\?/i }));
    expect(screen.getByText(/1\. Mayoría Simple/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Voto Aprobatorio/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Voto Preferencial/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cerrar explicación/i }));

    // Seleccionar 3 películas y abrir Entrada de Cine
    const firstButtons = screen.getAllByRole('button', { name: /^1º/ });
    const secondButtons = screen.getAllByRole('button', { name: /^2º/ });
    const thirdButtons = screen.getAllByRole('button', { name: /^3º/ });

    fireEvent.click(firstButtons[0]);
    fireEvent.click(secondButtons[1]);
    fireEvent.click(thirdButtons[2]);

    const reviewBtn = screen.getByRole('button', {
      name: /Revisar Entrada de Cine y Votar/i,
    });
    expect(reviewBtn).toBeEnabled();
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText('Tu Entrada de Cine')).toBeInTheDocument();
    });

    expect(localGetSpy).not.toHaveBeenCalled();
    expect(localSetSpy).not.toHaveBeenCalled();

    localGetSpy.mockRestore();
    localSetSpy.mockRestore();
  });

  it('abre el panel de Usuario Administrador al entrar en /admin', async () => {
    window.history.pushState({}, '', '/admin');
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Acceso de Administrador')).toBeInTheDocument();
      expect(screen.getByText('Clave de usuario administrador')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Profesorado/i)).not.toBeInTheDocument();

    window.history.pushState({}, '', '/');
  });
});
