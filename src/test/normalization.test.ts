import { describe, expect, it } from 'vitest';
import {
  localizeCampaignSubtitle,
  localizeCampaignTitle,
  translateGenreOrTag,
} from '../i18n/translations';
import { getReadableTextColor } from '../utils/colorExtractor';
import { computeVoteAuditHash, normalizeAuditHash } from '../utils/auditHash';
import {
  buildStudentFingerprint,
  isAllowedSchoolDomain,
  isDisposableEmail,
  isValidRfc5322Email,
  normalizeEmail,
  normalizeNamePart,
  validateVoterForm,
} from '../utils/normalization';
import { sanitizeHexColor, sanitizeSafeHttpUrl } from '../utils/urlSafety';

describe('Normalización de identidad y antifraude', () => {
  it('normaliza correo con trim, minúsculas y elimina alias +tag', () => {
    expect(normalizeEmail('  Lucia.Gomez@IESEjemplo.ES  ')).toBe(
      'lucia.gomez@iesejemplo.es'
    );
    expect(normalizeEmail('Lucia.Gomez+test99@gmail.com')).toBe(
      'lucia.gomez@gmail.com'
    );
  });

  it('sanitiza URLs peligrosas y calcula contraste legible', () => {
    expect(sanitizeSafeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeSafeHttpUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    expect(sanitizeSafeHttpUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
    expect(sanitizeHexColor('#38bdf8')).toBe('#38bdf8');
    expect(sanitizeHexColor('url(evil)', '#6366f1')).toBe('#6366f1');
    expect(getReadableTextColor('#312e81')).toBe('#ffffff');
    expect(getReadableTextColor('#facc15')).toBe('#020617');
  });

  it('traduce etiquetas de TMDB/IMDb y cabeceras de campaña en ES, VA y EN', () => {
    expect(translateGenreOrTag('Based on novel or book', 'es')).toBe('Basada en un libro');
    expect(translateGenreOrTag('Based on novel or book', 'va')).toBe('Basada en un llibre');
    expect(translateGenreOrTag('Portland, oregon', 'es')).toBe('Portland (Oregón)');
    expect(translateGenreOrTag('Portland, oregon', 'en')).toBe('Portland, Oregon');
    expect(translateGenreOrTag('London, england', 'va')).toBe('Londres (Anglaterra)');
    expect(translateGenreOrTag('Holiday', 'es')).toBe('Festividades');
    expect(translateGenreOrTag('Horse', 'va')).toBe('Cavalls');
    expect(localizeCampaignTitle('Cine ESO · Votación de Cartelera', 'en')).toBe(
      'School Cinema · Official Selection'
    );
    expect(
      localizeCampaignSubtitle(
        'Ordena tus películas favoritas. En este sistema todas tus preferencias cuentan.',
        'en'
      )
    ).toBe('Pick and rank your favorite movies. Every single preference adds points.');
  });

  it('elimina tildes, diacríticos y espacios dobles en nombre y apellidos', () => {
    expect(normalizeNamePart('  María   José  ')).toBe('maria jose');
    expect(normalizeNamePart('  Núñez   Águila  ')).toBe('nunez aguila');
    expect(normalizeNamePart('  Güell  Òscar ')).toBe('guell oscar');
  });

  it('calcula huella_alumno exactamente igual independientemente de tildes o mayúsculas', () => {
    const h1 = buildStudentFingerprint('Álvaro', 'García López', '2º ESO A');
    const h2 = buildStudentFingerprint('  alvaro  ', '  garcia   lopez ', '2º ESO A');
    expect(h1).toBe('alvaro_garcia lopez_2º ESO A');
    expect(h1).toBe(h2);
  });

  it('valida correos RFC 5322 correctamente', () => {
    expect(isValidRfc5322Email('alumno.1eso@educa.madrid.org')).toBe(true);
    expect(isValidRfc5322Email('sin-arroba.es')).toBe(false);
    expect(isValidRfc5322Email('doble..punto@gmail.com')).toBe(false);
    expect(isValidRfc5322Email('espacio dentro@gmail.com')).toBe(false);
  });

  it('bloquea dominios desechables y temporales conocidos', () => {
    expect(isDisposableEmail('prueba@mailinator.com')).toBe(true);
    expect(isDisposableEmail('alumno@10minutemail.com')).toBe(true);
    expect(isDisposableEmail('hack@sub.yopmail.com')).toBe(true);
    expect(isDisposableEmail('sofia@gmail.com')).toBe(false);
    expect(isDisposableEmail('sofia@iescervantes.es')).toBe(false);
  });

  it('filtra por dominios de centro cuando están configurados', () => {
    expect(isAllowedSchoolDomain('hugo@iescervantes.es', ['iescervantes.es'])).toBe(true);
    expect(isAllowedSchoolDomain('hugo@alumnos.iescervantes.es', ['iescervantes.es'])).toBe(true);
    expect(isAllowedSchoolDomain('hugo@gmail.com', ['iescervantes.es'])).toBe(false);
    expect(isAllowedSchoolDomain('hugo@gmail.com', [])).toBe(true);
  });

  it('rechaza formulario con dominio desechable y valida datos correctos', () => {
    const classes = ['1º ESO A', '2º ESO B'];
    const bad = validateVoterForm(
      { nombre: 'Hugo', apellidos: 'Pérez', curso: '1º ESO A', email: 'h@yopmail.com' },
      classes,
      []
    );
    expect(bad.valid).toBe(false);

    const ok = validateVoterForm(
      { nombre: '  Hugo  ', apellidos: 'Pérez   Gil', curso: '1º ESO A', email: '  HUGO@Gmail.com ' },
      classes,
      []
    );
    expect(ok.valid).toBe(true);
    expect(ok.normalized?.huellaAlumno).toBe('hugo_perez gil_1º ESO A');
    expect(ok.normalized?.email).toBe('hugo@gmail.com');
  });

  it('genera hashes de auditoría deterministas con formato VTP-XXXX-XXXX-XXXX y normaliza entradas', () => {
    const h1 = computeVoteAuditHash('vote-1234', '2º ESO A');
    const h2 = computeVoteAuditHash('vote-1234', '2º ESO A');
    const hOther = computeVoteAuditHash('vote-1235', '2º ESO A');

    expect(h1).toMatch(/^VTP-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
    expect(h1).toBe(h2);
    expect(h1).not.toBe(hOther);
    expect(normalizeAuditHash(`  ${h1.toLowerCase()}  `)).toBe(h1);
  });
});
