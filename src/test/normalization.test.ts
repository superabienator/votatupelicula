import { describe, expect, it } from 'vitest';
import {
  buildStudentFingerprint,
  isAllowedSchoolDomain,
  isDisposableEmail,
  isValidRfc5322Email,
  normalizeEmail,
  normalizeNamePart,
  validateVoterForm,
} from '../utils/normalization';

describe('Normalización de identidad y antifraude', () => {
  it('normaliza correo con trim y minúsculas', () => {
    expect(normalizeEmail('  Lucia.Gomez@IESEjemplo.ES  ')).toBe(
      'lucia.gomez@iesejemplo.es'
    );
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
});
