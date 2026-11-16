import { describe, expect, it } from 'vitest';
import { sandboxBackend } from '../services/sandboxBackend';

describe('Flujo antifraude OTP y gestión en 2 fases', () => {
  it('permite votos consecutivos de distintos alumnos y bloquea duplicados por email o huella', async () => {
    const ballot = await sandboxBackend.getBallotData();
    const top3Ids = ballot.movies.slice(0, 3).map((m) => m.id);

    // Alumno 1 vota
    const challenge1 = await sandboxBackend.requestOtp({
      nombre: 'Álvaro',
      apellidos: 'Gómez Ruiz',
      curso: '1º ESO A',
      email: 'alvaro.gr@centro.es',
      movie_ids: top3Ids,
    });
    expect(challenge1.dev_otp_preview).toMatch(/^\d{4}$/);

    // Intento fallido y luego correcto
    await expect(
      sandboxBackend.verifyOtp({
        challenge_id: challenge1.challenge_id,
        code: challenge1.dev_otp_preview === '0000' ? '9999' : '0000',
      })
    ).rejects.toThrow(/quedan 2 intento/);

    const receipt1 = await sandboxBackend.verifyOtp({
      challenge_id: challenge1.challenge_id,
      code: challenge1.dev_otp_preview!,
    });
    expect(receipt1.vote_id).toBeTruthy();

    // Alumno 2 en el MISMO navegador/sesión puede votar sin bloqueo local
    const challenge2 = await sandboxBackend.requestOtp({
      nombre: 'Carmen',
      apellidos: 'Navarro Díaz',
      curso: '1º ESO A',
      email: 'carmen.nd@centro.es',
      movie_ids: [...top3Ids].reverse(),
    });
    const receipt2 = await sandboxBackend.verifyOtp({
      challenge_id: challenge2.challenge_id,
      code: challenge2.dev_otp_preview!,
    });
    expect(receipt2.vote_id).toBeTruthy();

    // Intento fraudulento 1: mismo email
    await expect(
      sandboxBackend.requestOtp({
        nombre: 'Otro',
        apellidos: 'Nombre',
        curso: '1º ESO A',
        email: '  ALVARO.GR@CENTRO.ES ',
        movie_ids: top3Ids,
      })
    ).rejects.toThrow(/correo electrónico/);

    // Intento fraudulento 2: distinto email pero misma huella sin tildes/espacios
    await expect(
      sandboxBackend.requestOtp({
        nombre: '  alvaro ',
        apellidos: 'GOMEZ   ruiz',
        curso: '1º ESO A',
        email: 'alvaro.segundo.correo@gmail.com',
        movie_ids: top3Ids,
      })
    ).rejects.toThrow(/ya ha emitido su voto/);
  });

  it('mantiene borradores ocultos al público hasta aprobar y publicar cartelera', async () => {
    const before = await sandboxBackend.getBallotData();
    const initialCount = before.movies.length;

    const drafts = await sandboxBackend.adminEnrichBatch('demo1234', ['Coco']);
    expect(drafts).toHaveLength(1);
    expect(drafts[0].status).toBe('draft');

    // Público sigue sin ver el borrador
    const mid = await sandboxBackend.getBallotData();
    expect(mid.movies).toHaveLength(initialCount);

    // Fase 2: aprobar y publicar
    await sandboxBackend.adminPublishBillboard('demo1234', [drafts[0].id]);
    const after = await sandboxBackend.getBallotData();
    expect(after.movies.some((m) => m.id === drafts[0].id && m.status === 'published')).toBe(
      true
    );
  });

  it('permite modificar un voto individual, anularlo y vaciar la urna a cero sin borrar películas', async () => {
    const res1 = await sandboxBackend.adminGetResults('demo1234');
    expect(res1.total_votes).toBeGreaterThan(0);
    expect(res1.votes_log.length).toBe(res1.total_votes);

    const firstVote = res1.votes_log[0];
    await sandboxBackend.adminUpdateVote('demo1234', firstVote.id, {
      curso: '4º ESO B',
    });
    const afterUpdate = await sandboxBackend.adminGetResults('demo1234');
    expect(afterUpdate.votes_log.find((v) => v.id === firstVote.id)?.curso).toBe('4º ESO B');

    await sandboxBackend.adminDeleteVote('demo1234', firstVote.id);
    const afterDelete = await sandboxBackend.adminGetResults('demo1234');
    expect(afterDelete.total_votes).toBe(res1.total_votes - 1);

    await sandboxBackend.adminResetVotes('demo1234');
    const afterReset = await sandboxBackend.adminGetResults('demo1234');
    expect(afterReset.total_votes).toBe(0);
    expect(afterReset.votes_log).toHaveLength(0);

    // La cartelera sigue intacta
    const ballot = await sandboxBackend.getBallotData();
    expect(ballot.movies.length).toBeGreaterThan(0);
  });
});
