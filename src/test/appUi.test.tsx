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
    fireEvent.click(screen.getByRole('button', { name: /^Cerrar$/i }));

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

  it('muestra el estado público de la votación sin identidades y la coletilla RGPD/LOPDGDD tras votar y cerrar sesión', async () => {
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Interstellar')).toBeInTheDocument();
    });

    // Abrir estado público de la votación
    fireEvent.click(screen.getByRole('button', { name: /Estado de la votación/i }));
    await waitFor(() => {
      expect(screen.getByText('Estado en vivo de la votación')).toBeInTheDocument();
      expect(
        screen.getByText(/Identidades 100% protegidas \(RGPD \/ LOPDGDD\)/i)
      ).toBeInTheDocument();
    });

    // Garantizar que no se filtra ningún email ni nombre de votante en la vista pública
    expect(screen.queryByText(/lucia\.m@demo\.es/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hugo\.s@demo\.es/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Cerrar estado de la votación/i }));

    // Comprobar traducción de Estado de votación y coletilla RGPD en Valencià e Inglés
    fireEvent.click(screen.getByRole('button', { name: 'VA' }));
    expect(screen.getByRole('button', { name: /Estat de la votació/i })).toBeInTheDocument();
    expect(screen.getByText(/RGPD UE 2016\/679/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    expect(screen.getByRole('button', { name: /Live standings/i })).toBeInTheDocument();
    expect(screen.getByText(/GDPR EU 2016\/679/i)).toBeInTheDocument();

    // Volver a ES, votar y cerrar sesión (logout) viendo coletilla legal
    fireEvent.click(screen.getByRole('button', { name: 'ES' }));
    const firstButtons = screen.getAllByRole('button', { name: /^1º/ });
    const secondButtons = screen.getAllByRole('button', { name: /^2º/ });
    const thirdButtons = screen.getAllByRole('button', { name: /^3º/ });

    fireEvent.click(firstButtons[0]);
    fireEvent.click(secondButtons[1]);
    fireEvent.click(thirdButtons[2]);

    fireEvent.click(screen.getByRole('button', { name: /Revisar Entrada de Cine y Votar/i }));
    fireEvent.click(screen.getByRole('button', { name: /Confirmar e identificarme/i }));

    // Verifica que el aviso RGPD art. 13 aparece ANTES de introducir datos personales
    expect(screen.getByText(/Información RGPD \/ LOPDGDD/i)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Ej. Lucía'), {
      target: { value: 'Elena' },
    });
    fireEvent.change(screen.getByPlaceholderText('Ej. García López'), {
      target: { value: 'Vidal Soler' },
    });
    fireEvent.change(screen.getByPlaceholderText(/tu\.correo@ejemplo\.es/i), {
      target: { value: 'elena.vidal@iesejemplo.es' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar código de verificación/i }));

    await waitFor(() => {
      expect(screen.getByText('Introduce tu código de 4 cifras')).toBeInTheDocument();
    });

    const demoCodeEl = screen.getByTestId('demo-otp-code');
    const code = demoCodeEl.textContent!.trim();
    const digitInputs = [1, 2, 3, 4].map((n) =>
      screen.getByLabelText(`Dígito ${n}`)
    );
    code.split('').forEach((ch, idx) => {
      fireEvent.change(digitInputs[idx], { target: { value: ch } });
    });

    fireEvent.click(screen.getByRole('button', { name: /Validar y registrar voto/i }));

    await waitFor(() => {
      expect(screen.getByText('¡Voto registrado con éxito!')).toBeInTheDocument();
      expect(
        screen.getByText(/Aviso de Protección de Datos y Anonimato \(RGPD \/ LOPDGDD\)/i)
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', { name: /Cerrar sesión y finalizar/i })
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Sesión cerrada correctamente y memoria del dispositivo limpiada/i)
      ).toBeInTheDocument();
    });
  });

  it('abre el panel de Usuario Administrador al entrar en /admin y limpia la sesión al salir', async () => {
    window.history.pushState({}, '', '/admin');
    renderApp();

    await waitFor(() => {
      expect(screen.getByText('Acceso de Administrador')).toBeInTheDocument();
      expect(screen.getByText('Clave de usuario administrador')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Profesorado/i)).not.toBeInTheDocument();

    // Inicia sesión con la clave demo y cierra el panel
    fireEvent.change(screen.getByLabelText('Clave de usuario administrador'), {
      target: { value: 'demo1234' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Entrar al Panel de Administración/i })
    );
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /Cartelera/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Volver a Cartelera Pública/i }));
    await waitFor(() => {
      expect(screen.queryByText('Acceso de Administrador')).not.toBeInTheDocument();
    });

    // Volver a /admin exige autenticarse de nuevo en ordenadores compartidos
    window.history.pushState({}, '', '/admin');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await waitFor(() => {
      expect(screen.getByText('Acceso de Administrador')).toBeInTheDocument();
    });

    window.history.pushState({}, '', '/');
  });
});
