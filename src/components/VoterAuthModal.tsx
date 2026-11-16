import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cinemaApi } from '../services/api';
import type {
  Movie,
  OtpChallenge,
  VoteReceipt,
  VoterIdentityForm,
  VotingSettings,
} from '../types/cinema';
import { validateVoterForm } from '../utils/normalization';
import { useEscapeKey } from '../utils/useEscapeKey';

interface VoterAuthModalProps {
  open: boolean;
  settings: VotingSettings;
  rankedMovies: Movie[];
  onClose: () => void;
  onVoteCompleted: (receipt: VoteReceipt) => void;
}

type Step = 'identity' | 'otp' | 'success';

export function VoterAuthModal({
  open,
  settings,
  rankedMovies,
  onClose,
  onVoteCompleted,
}: VoterAuthModalProps) {
  const [step, setStep] = useState<Step>('identity');
  const [form, setForm] = useState<VoterIdentityForm>({
    nombre: '',
    apellidos: '',
    curso: settings.allowed_classes[0] || '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [expiresSecondsLeft, setExpiresSecondsLeft] = useState(600);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);
  const [receipt, setReceipt] = useState<VoteReceipt | null>(null);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  useEscapeKey(open && step !== 'success', onClose);

  // Reiniciar estado cuando se cierra el modal (en memoria, sin almacenamiento local)
  useEffect(() => {
    if (!open) {
      setStep('identity');
      setForm({
        nombre: '',
        apellidos: '',
        curso: settings.allowed_classes[0] || '',
        email: '',
      });
      setError(null);
      setChallenge(null);
      setOtpDigits(['', '', '', '']);
      setExpiresSecondsLeft(600);
      setCooldownSecondsLeft(0);
      setReceipt(null);
    }
  }, [open, settings.allowed_classes]);

  // Temporizadores de validez (10 min) y reenvío (60s)
  useEffect(() => {
    if (!open || step !== 'otp') return;
    const timer = window.setInterval(() => {
      setExpiresSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setCooldownSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, step]);

  async function handleRequestOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    const validation = validateVoterForm(
      form,
      settings.allowed_classes,
      settings.allowed_email_domains
    );
    if (!validation.valid) {
      setError(validation.error || 'Revisa tus datos antes de continuar.');
      return;
    }

    setLoading(true);
    try {
      const res = await cinemaApi.requestOtp({
        nombre: form.nombre,
        apellidos: form.apellidos,
        curso: form.curso,
        email: form.email,
        movie_ids: rankedMovies.map((m) => m.id),
      });
      setChallenge(res);
      setOtpDigits(['', '', '', '']);
      setExpiresSecondsLeft(res.expires_in_seconds || 600);
      setCooldownSecondsLeft(res.cooldown_seconds || 60);
      setStep('otp');
      window.setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el código OTP.');
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, rawValue: string) {
    const clean = rawValue.replace(/\D/g, '');
    if (clean.length > 1) {
      // Soporte de pegado rápido de 4 dígitos
      const chars = clean.slice(0, 4).split('');
      const next = ['', '', '', ''];
      chars.forEach((c, idx) => {
        next[idx] = c;
      });
      setOtpDigits(next);
      const focusIdx = Math.min(3, chars.length);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    if (clean && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    const code = otpDigits.join('');
    if (!/^\d{4}$/.test(code)) {
      setError('Introduce las 4 cifras del código recibido en tu correo.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await cinemaApi.verifyOtp({
        challenge_id: challenge.challenge_id,
        code,
      });
      const fullReceipt: VoteReceipt = {
        ...result,
        rankedMovies,
      };
      setReceipt(fullReceipt);
      setStep('success');
      onVoteCompleted(fullReceipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto.');
    } finally {
      setLoading(false);
    }
  }

  const mm = String(Math.floor(expiresSecondsLeft / 60)).padStart(2, '0');
  const ss = String(expiresSecondsLeft % 60).padStart(2, '0');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={step === 'success' ? undefined : onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#0e1220] p-6 text-slate-100 shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {step !== 'success' && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar verificación"
                className="absolute right-4 top-4 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* PASO 1: IDENTIFICACIÓN */}
            {step === 'identity' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Control antifraude · 1 alumno = 1 voto
                  </span>
                  <h2
                    id="auth-modal-title"
                    className="mt-2 font-display text-2xl font-extrabold text-white"
                  >
                    Identifícate para validar tu voto
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    Te enviaremos un código de 4 dígitos al correo.{' '}
                    <strong className="text-sky-300">
                      No guardamos cookies ni bloqueamos el navegador
                    </strong>
                    : otro compañero podrá votar después en este mismo dispositivo.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      enterKeyHint="next"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder="Ej. Lucía"
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      enterKeyHint="next"
                      value={form.apellidos}
                      onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                      placeholder="Ej. García López"
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Curso / Grupo *
                  </label>
                  <select
                    required
                    value={form.curso}
                    onChange={(e) => setForm({ ...form, curso: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-[#090c16] px-3.5 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
                  >
                    {settings.allowed_classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-300">
                    Correo electrónico *
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      enterKeyHint="send"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={
                        settings.allowed_email_domains.length > 0
                          ? `tu.nombre@${settings.allowed_email_domains[0]}`
                          : 'tu.correo@ejemplo.es'
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/40 py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                    />
                  </div>
                  {settings.allowed_email_domains.length > 0 && (
                    <p className="mt-1 text-[11px] text-sky-300">
                      Dominios admitidos por el centro:{' '}
                      {settings.allowed_email_domains.join(', ')}
                    </p>
                  )}
                </div>

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:brightness-110 disabled:opacity-50"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--theme-accent), var(--theme-primary))',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando código de 4 dígitos…
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      Enviar código de verificación
                    </>
                  )}
                </button>
              </form>
            )}

            {/* PASO 2: INTRODUCCIÓN DE OTP DE 4 DÍGITOS */}
            {step === 'otp' && challenge && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                    <Mail className="h-3.5 w-3.5" />
                    Revisa tu bandeja de entrada
                  </span>
                  <h2
                    id="auth-modal-title"
                    className="mt-2 font-display text-2xl font-extrabold text-white"
                  >
                    Introduce tu código de 4 cifras
                  </h2>
                  <p className="mt-1 text-xs text-slate-300">
                    Hemos enviado el código a{' '}
                    <strong className="text-white">{challenge.email}</strong>. Caduca en{' '}
                    <span className="font-mono font-bold text-amber-300">
                      {mm}:{ss}
                    </span>{' '}
                    (máximo 3 intentos).
                  </p>
                </div>

                {/* Aviso transparente si está en modo demo / dev */}
                {challenge.dev_otp_preview && (
                  <div className="rounded-2xl border border-amber-400/35 bg-amber-400/10 p-3 text-xs text-amber-200">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <Sparkles className="h-4 w-4" />
                      Bandeja simulada (Modo Demo / Dev)
                    </div>
                    <p className="mt-1">
                      Tu código de verificación generado es:{' '}
                      <span className="ml-1 rounded bg-black/40 px-2 py-0.5 font-mono text-base font-extrabold tracking-widest text-white">
                        {challenge.dev_otp_preview}
                      </span>
                    </p>
                  </div>
                )}

                {/* 4 casillas numéricas */}
                <div className="flex justify-center gap-3 py-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={4}
                      aria-label={`Dígito ${idx + 1} del código`}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="h-16 w-14 rounded-2xl border-2 border-white/20 bg-black/50 text-center font-mono text-3xl font-extrabold text-white transition focus:border-amber-400 focus:outline-none sm:h-18 sm:w-16"
                    />
                  ))}
                </div>

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || expiresSecondsLeft === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:brightness-110 disabled:opacity-50"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--theme-accent), var(--theme-primary))',
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando código…
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Validar y registrar voto
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => setStep('identity')}
                    className="underline-offset-2 hover:text-white hover:underline"
                  >
                    ← Cambiar datos
                  </button>

                  <button
                    type="button"
                    disabled={cooldownSecondsLeft > 0 || loading}
                    onClick={() => handleRequestOtp()}
                    className="inline-flex items-center gap-1.5 font-semibold text-sky-300 transition hover:text-sky-200 disabled:text-slate-500"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {cooldownSecondsLeft > 0
                      ? `Reenviar en ${cooldownSecondsLeft}s`
                      : 'Reenviar nuevo código'}
                  </button>
                </div>
              </form>
            )}

            {/* PASO 3: CONFIRMACIÓN Y RESET LIMPIO PARA EL SIGUIENTE COMPAÑERO */}
            {step === 'success' && receipt && (
              <div className="space-y-5 text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-400/40"
                >
                  <CheckCircle2 className="h-9 w-9" />
                </motion.div>

                <div>
                  <h2
                    id="auth-modal-title"
                    className="font-display text-2xl font-extrabold text-white"
                  >
                    ¡Voto registrado con éxito!
                  </h2>
                  <p className="mt-1 text-xs text-slate-300">
                    Tu voto preferencial de <strong>{receipt.curso}</strong> ya forma parte del
                    escrutinio.
                  </p>
                  <p className="mt-2 inline-block rounded-lg bg-black/40 px-3 py-1 font-mono text-[11px] text-slate-400">
                    Recibo #{receipt.vote_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Tu orden guardado
                  </p>
                  <ol className="space-y-1.5 text-sm">
                    {receipt.rankedMovies.map((m, idx) => (
                      <li key={m.id} className="flex items-center justify-between">
                        <span className="text-slate-100">
                          <strong className="mr-2 font-mono text-amber-300">{idx + 1}º</strong>
                          {m.title}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-slate-200"
                >
                  Listo · Dejar votar al siguiente compañero/a
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
