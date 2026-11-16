/**
 * Normalización estricta y control antifraude de identidad estudiantil.
 * Nota: Cualquier cambio aquí debe mantenerse alineado con
 * src/utils/normalization.ts y supabase/migrations/001_initial_schema.sql.
 */

export const DISPOSABLE_EMAIL_DOMAINS = new Set<string>([
  '10minutemail.com',
  '10minutemail.net',
  '10minutemail.org',
  '10minmail.com',
  '20minutemail.com',
  '33mail.com',
  'anonbox.net',
  'binkmail.com',
  'bobmail.info',
  'burnermail.io',
  'byom.de',
  'chammy.info',
  'crazymailing.com',
  'discard.email',
  'discardmail.com',
  'discardmail.de',
  'disposable-email.ml',
  'disposableaddress.com',
  'disposableemailaddresses.com',
  'dispostable.com',
  'dodgeit.com',
  'dodgit.com',
  'dropmail.me',
  'e4ward.com',
  'emailondeck.com',
  'emailtemporanea.com',
  'emailtemporario.com.br',
  'fakeinbox.com',
  'fakemail.fr',
  'fakemailgenerator.com',
  'fastacura.com',
  'filzmail.com',
  'getairmail.com',
  'getnada.com',
  'getonemail.com',
  'gishpuppy.com',
  'grr.la',
  'guerrillamail.biz',
  'guerrillamail.com',
  'guerrillamail.de',
  'guerrillamail.info',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamailblock.com',
  'harakirimail.com',
  'hidemail.de',
  'hmamail.com',
  'imgof.com',
  'inboxalias.com',
  'inboxbear.com',
  'incognitomail.com',
  'incognitomail.net',
  'incognitomail.org',
  'jetable.com',
  'jetable.fr.nf',
  'jetable.net',
  'jetable.org',
  'kasmail.com',
  'killmail.com',
  'klzlk.com',
  'koszmail.pl',
  'kurzepost.de',
  'lhsdv.com',
  'lifebyfood.com',
  'lookugly.com',
  'lopl.co.cc',
  'lr78.com',
  'mail-temporaire.fr',
  'mailcatch.com',
  'maildrop.cc',
  'maileater.com',
  'mailexpire.com',
  'mailforspam.com',
  'mailfreeonline.com',
  'mailimate.com',
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'mailinator2.com',
  'mailmetrash.com',
  'mailmoat.com',
  'mailna.co',
  'mailna.in',
  'mailna.me',
  'mailnesia.com',
  'mailnull.com',
  'mailshell.com',
  'mailsiphon.com',
  'mailtemp.info',
  'mailtothis.com',
  'meltmail.com',
  'mierdamail.com',
  'mintemail.com',
  'moakt.com',
  'mohmal.com',
  'mt2014.com',
  'mt2015.com',
  'mytemp.email',
  'mytrashmail.com',
  'nada.email',
  'nepwk.com',
  'nervmich.net',
  'nervtmich.net',
  'netmails.net',
  'no-spam.ws',
  'nobulk.com',
  'noclickemail.com',
  'nogmailspam.info',
  'nomail.xl.cx',
  'nomail2me.com',
  'nospam.ze.tc',
  'nospam4.us',
  'nospamfor.us',
  'nowmymail.com',
  'objectmail.com',
  'obobbo.com',
  'oneoffemail.com',
  'onewaymail.com',
  'owlpic.com',
  'pookmail.com',
  'proxymail.eu',
  'putthisinyourspamdatabase.com',
  'quickinbox.com',
  'rcpt.at',
  'recode.me',
  'recursor.net',
  'regbypass.com',
  'rmqkr.net',
  'rtrtr.com',
  's0ny.net',
  'safe-mail.net',
  'safetymail.info',
  'sendspamhere.com',
  'sharklasers.com',
  'shiftmail.com',
  'shitmail.me',
  'skeefmail.com',
  'slaskpost.se',
  'slopsbox.com',
  'smellfear.com',
  'snakemail.com',
  'sneakemail.com',
  'sofimail.com',
  'sofort-mail.de',
  'sogetthis.com',
  'soodonims.com',
  'spam4.me',
  'spamavert.com',
  'spambob.net',
  'spambog.com',
  'spambog.de',
  'spambox.us',
  'spamcero.com',
  'spamcon.org',
  'spamcorptastic.com',
  'spamcowboy.com',
  'spamday.com',
  'spamex.com',
  'spamfree24.org',
  'spamgourmet.com',
  'spamherelots.com',
  'spamhole.com',
  'spamify.com',
  'spaml.de',
  'spammotel.com',
  'spamobox.com',
  'spamspot.com',
  'spamthis.co.uk',
  'supergreatmail.com',
  'supermailer.jp',
  'suremail.info',
  'teewars.org',
  'teleworm.us',
  'temp-mail.io',
  'temp-mail.org',
  'temp-mail.ru',
  'tempail.com',
  'tempalias.com',
  'tempe-mail.com',
  'tempemail.biz',
  'tempemail.com',
  'tempemail.net',
  'tempinbox.co.uk',
  'tempinbox.com',
  'tempmail.com',
  'tempmail.de',
  'tempmail.eu',
  'tempmail.net',
  'tempmail2.com',
  'tempmailaddress.com',
  'tempmailer.com',
  'tempmailo.com',
  'tempr.email',
  'tempsky.com',
  'thanksnospam.info',
  'thankyou2010.com',
  'thisisnotmyrealemail.com',
  'throwawayemailaddress.com',
  'throwawaymail.com',
  'tilien.com',
  'tmailinator.com',
  'tradermail.info',
  'trash-amil.com',
  'trash-mail.at',
  'trash-mail.com',
  'trash-mail.de',
  'trash2009.com',
  'trashemail.de',
  'trashmail.at',
  'trashmail.com',
  'trashmail.de',
  'trashmail.me',
  'trashmail.net',
  'trashmail.org',
  'trashmailer.com',
  'trashymail.com',
  'tyldd.com',
  'uggsrock.com',
  'wegwerfmail.de',
  'wegwerfmail.net',
  'wegwerfmail.org',
  'wh4f.org',
  'whyspam.me',
  'willselfdestruct.com',
  'xagloo.com',
  'xemaps.com',
  'xents.com',
  'xmaily.com',
  'xoxy.net',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'yuurok.com',
  'zehnminutenmail.de',
  'zippymail.info',
  'zoemail.org',
]);

// Validación práctica estricta compatible con RFC 5322 (sin espacios ni puntos inválidos)
const RFC5322_LOCAL_REGEX =
  /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const RFC5322_DOMAIN_REGEX =
  /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function stripAccents(raw: string): string {
  return raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeNamePart(raw: string): string {
  return stripAccents(raw)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function buildStudentFingerprint(
  nombre: string,
  apellidos: string,
  curso: string
): string {
  const normNombre = normalizeNamePart(nombre);
  const normApellidos = normalizeNamePart(apellidos);
  const normCurso = curso.trim();
  return `${normNombre}_${normApellidos}_${normCurso}`;
}

export function isValidRfc5322Email(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;

  const atIndex = normalized.indexOf('@');
  if (atIndex <= 0 || atIndex !== normalized.lastIndexOf('@')) return false;

  const local = normalized.slice(0, atIndex);
  const domain = normalized.slice(atIndex + 1);

  if (local.length > 64 || domain.length > 253) return false;
  return RFC5322_LOCAL_REGEX.test(local) && RFC5322_DOMAIN_REGEX.test(domain);
}

export function extractEmailDomain(email: string): string {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.lastIndexOf('@');
  return atIndex >= 0 ? normalized.slice(atIndex + 1) : '';
}

export function isDisposableEmail(email: string): boolean {
  const domain = extractEmailDomain(email);
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  // Comprueba subdominios de servicios desechables (ej. sub.yopmail.com)
  const parts = domain.split('.');
  for (let i = 1; i < parts.length - 1; i++) {
    const parent = parts.slice(i).join('.');
    if (DISPOSABLE_EMAIL_DOMAINS.has(parent)) return true;
  }
  return false;
}

export function isAllowedSchoolDomain(
  email: string,
  allowedDomains: string[]
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const domain = extractEmailDomain(email);
  if (!domain) return false;

  return allowedDomains.some((allowedRaw) => {
    const allowed = allowedRaw.trim().toLowerCase().replace(/^@/, '');
    if (!allowed) return false;
    return domain === allowed || domain.endsWith(`.${allowed}`);
  });
}

export interface VoterValidationResult {
  valid: boolean;
  error?: string;
  normalized?: {
    nombre: string;
    apellidos: string;
    curso: string;
    email: string;
    huellaAlumno: string;
  };
}

export function validateVoterIdentity(
  input: {
    nombre: string;
    apellidos: string;
    curso: string;
    email: string;
  },
  allowedClasses: string[],
  allowedEmailDomains: string[]
): VoterValidationResult {
  const nombre = normalizeNamePart(input.nombre || '');
  const apellidos = normalizeNamePart(input.apellidos || '');
  const curso = (input.curso || '').trim();
  const email = normalizeEmail(input.email || '');

  if (nombre.length < 2 || nombre.length > 80) {
    return { valid: false, error: 'Introduce tu nombre real (mínimo 2 caracteres).' };
  }
  if (apellidos.length < 2 || apellidos.length > 100) {
    return { valid: false, error: 'Introduce tus apellidos reales (mínimo 2 caracteres).' };
  }
  if (!/^[\p{L}\s'-]+$/u.test(input.nombre.trim()) || !/^[\p{L}\s'-]+$/u.test(input.apellidos.trim())) {
    return {
      valid: false,
      error: 'El nombre y los apellidos solo pueden contener letras, espacios o guiones.',
    };
  }

  if (!allowedClasses.includes(curso)) {
    return {
      valid: false,
      error: 'Selecciona un Curso / Grupo válido de la lista del centro.',
    };
  }

  if (!isValidRfc5322Email(email)) {
    return {
      valid: false,
      error: 'El correo electrónico no cumple un formato válido (RFC 5322).',
    };
  }

  if (isDisposableEmail(email)) {
    return {
      valid: false,
      error:
        'No se admiten correos temporales o desechables. Usa tu correo escolar o personal real.',
    };
  }

  if (!isAllowedSchoolDomain(email, allowedEmailDomains)) {
    return {
      valid: false,
      error: `Solo se permiten correos del centro (${allowedEmailDomains.join(', ')}).`,
    };
  }

  return {
    valid: true,
    normalized: {
      nombre,
      apellidos,
      curso,
      email,
      huellaAlumno: buildStudentFingerprint(nombre, apellidos, curso),
    },
  };
}
