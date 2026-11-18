import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Fingerprint,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { getLocalizedMovie } from '../i18n/translations';
import { cinemaApi } from '../services/api';
import type {
  Movie,
  OtpChallenge,
  VoteReceipt,
  VoterIdentityForm,
  VotingSettings,
} from '../types/cinema';
import { computeVoteAuditHash } from '../utils/auditHash';
import { validateVoterForm } from '../utils/normalization';
import { useEscapeKey } from '../utils/useEscapeKey';
import { useModalFocus } from '../utils/useModalFocus';

interface VoterAuthModalProps {
  open: boolean;
  settings: VotingSettings;
  rankedMovies: Movie[];
  onClose: () => void;
  onVoteCompleted: (receipt: VoteReceipt) => void;
  onVoterLogout: () => void;
  onViewStandings: (auditHash?: string) => void;
}

type Step = 'identity' | 'otp' | 'success';

export function VoterAuthModal({
  open,
  settings,
  rankedMovies,
  onClose,
  onVoteCompleted,
  onVoterLogout,
  onViewStandings,
}: VoterAuthModalProps) {
  const { lang, t } = useI18n();
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
  const [otpCode, setOtpCode] = useState('');
  const [expiresSecondsLeft, setExpiresSecondsLeft] = useState(600);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(0);
  const [receipt, setReceipt] = useState<VoteReceipt | null>(null);
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [sendingReceipt, setSendingReceipt] = useState(false);
  const [receiptSentEmail, setReceiptSentEmail] = useState<string | null>(null);
  const [receiptSendError, setReceiptSendError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const otpInputRef = useRef<HTMLInputElement | null>(null);
  useEscapeKey(open && step !== 'success', onClose);
  useModalFocus(open, dialogRef);

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
      setOtpCode('');
      setExpiresSecondsLeft(600);
      setCooldownSecondsLeft(0);
      setReceipt(null);
      setCopiedAudit(false);
      setSendingReceipt(false);
      setReceiptSentEmail(null);
      setReceiptSendError(null);
    }
  }, [open, settings.allowed_classes]);

  const handleCopyAuditHash = async () => {
    if (!receipt?.audit_hash) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(receipt.audit_hash);
      }
      setCopiedAudit(true);
      window.setTimeout(() => setCopiedAudit(false), 2500);
    } catch {
      setCopiedAudit(true);
      window.setTimeout(() => setCopiedAudit(false), 2500);
    }
  };

  const handleSendReceiptEmail = async () => {
    if (!challenge || !receipt || sendingReceipt) return;
    setSendingReceipt(true);
    setReceiptSendError(null);
    try {
      const res = await cinemaApi.sendVoteReceipt({
        challenge_id: challenge.challenge_id,
        vote_id: receipt.vote_id,
      });
      setReceiptSentEmail(res.email || challenge.email);
    } catch (err) {
      setReceiptSendError(
        err instanceof Error ? err.message : t.receiptEmailErrorFallback
      );
    } finally {
      setSendingReceipt(false);
    }
  };

  // Temporizadores de validez (10 min) y reenvío (60s)
  useEffect(() => {
    if (!open || step !== 'otp') return;
    const timer = window.setInterval(() => {
      setExpiresSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setCooldownSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, step]);

  function translateError(code?: string, fallback?: string): string {
    if (code === 'DOMAIN_NOT_ALLOWED' && settings.allowed_email_domains.length > 0) {
      return `${t.errorCodes.DOMAIN_NOT_ALLOWED} (${t.allowedDomainsHint(settings.allowed_email_domains)})`;
    }
    if (code && t.errorCodes[code]) {
      return t.errorCodes[code];
    }
    return fallback || t.loadErrorFallback;
  }

  async function handleRequestOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);

    const validation = validateVoterForm(
      form,
      settings.allowed_classes,
      settings.allowed_email_domains
    );
    if (!validation.valid) {
      setError(translateError(validation.errorCode, validation.error));
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
      setOtpCode('');
      setExpiresSecondsLeft(res.expires_in_seconds || 600);
      setCooldownSecondsLeft(res.cooldown_seconds || 60);
      setStep('otp');
      window.setTimeout(() => otpInputRef.current?.focus(), 80);
    } catch (err) {
      const coded = err as Error & { code?: string };
      setError(translateError(coded?.code, coded?.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!challenge) return;
    if (expiresSecondsLeft === 0) {
      setError(t.otpExpiredError);
      return;
    }
    const code = otpCode.trim();
    if (!/^\d{4}$/.test(code)) {
      setError(t.errorCodes.INVALID_OTP);
      otpInputRef.current?.focus();
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
        audit_hash:
          result.audit_hash || computeVoteAuditHash(result.vote_id, result.curso),
        rankedMovies,
      };
      setReceipt(fullReceipt);
      setStep('success');
      onVoteCompleted(fullReceipt);
    } catch (err) {
      const coded = err as Error & { code?: string };
      setError(translateError(coded?.code, coded?.message));
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
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-3xl border border-white/15 bg-[#12172e] p-6 text-slate-100 shadow-2xl outline-none"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {step !== 'success' && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t.closeBtn}
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
                    {t.authAntiFraudBadge}
                  </span>
                  <h2
                    id="auth-modal-title"
                    className="mt-2 font-display text-2xl font-extrabold text-white"
                  >
                    {t.authTitle}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">
                    {t.authNoticeBefore}
                    <strong className="text-sky-300">{t.authNoticeBold}</strong>
                    {t.authNoticeAfter}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="voter-nombre"
                      className="mb-1 block text-xs font-semibold text-slate-300"
                    >
                      {t.fieldNombre}
                    </label>
                    <input
                      id="voter-nombre"
                      type="text"
                      required
                      autoComplete="off"
                      enterKeyHint="next"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      placeholder={t.fieldNombrePh}
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-base text-white placeholder:text-slate-400 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="voter-apellidos"
                      className="mb-1 block text-xs font-semibold text-slate-300"
                    >
                      {t.fieldApellidos}
                    </label>
                    <input
                      id="voter-apellidos"
                      type="text"
                      required
                      autoComplete="off"
                      enterKeyHint="next"
                      value={form.apellidos}
                      onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                      placeholder={t.fieldApellidosPh}
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-base text-white placeholder:text-slate-400 focus:border-sky-400"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="voter-curso"
                    className="mb-1 block text-xs font-semibold text-slate-300"
                  >
                    {t.fieldCurso}
                  </label>
                  <select
                    id="voter-curso"
                    required
                    value={form.curso}
                    onChange={(e) => setForm({ ...form, curso: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-[#0d1226] px-3.5 py-2.5 text-base text-white focus:border-sky-400"
                  >
                    {settings.allowed_classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="voter-email"
                    className="mb-1 block text-xs font-semibold text-slate-300"
                  >
                    {t.fieldEmail}
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      id="voter-email"
                      type="email"
                      inputMode="email"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      enterKeyHint="send"
                      aria-invalid={Boolean(error)}
                      aria-describedby={
                        [
                          settings.allowed_email_domains.length > 0 ? 'voter-domains-hint' : null,
                          error ? 'voter-form-error' : null,
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined
                      }
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={
                        settings.allowed_email_domains.length > 0
                          ? `tu.nombre@${settings.allowed_email_domains[0]}`
                          : t.emailPlaceholder
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/40 py-2.5 pl-10 pr-3.5 text-base text-white placeholder:text-slate-400 focus:border-sky-400"
                    />
                  </div>
                  {settings.allowed_email_domains.length > 0 && (
                    <p id="voter-domains-hint" className="mt-1 text-[11px] text-sky-300">
                      {t.allowedDomainsHint(settings.allowed_email_domains)}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-[11px] leading-relaxed text-emerald-100">
                  {t.gdprPreCollectionNotice}
                </div>

                {error && (
                  <div
                    id="voter-form-error"
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
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-sky-300 px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:brightness-105 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.sendingOtpBtn}
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4" />
                      {t.sendOtpBtn}
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
                    {t.otpInboxBadge}
                  </span>
                  <h2
                    id="auth-modal-title"
                    className="mt-2 font-display text-2xl font-extrabold text-white"
                  >
                    {t.otpTitle}
                  </h2>
                  <p className="mt-1 text-xs text-slate-300">
                    {t.otpSubtitle(challenge.email, `${mm}:${ss}`)}
                  </p>
                </div>

                {/* Aviso transparente si está en modo demo / dev */}
                {challenge.dev_otp_preview && (
                  <div className="rounded-2xl border border-amber-400/35 bg-amber-400/10 p-3 text-xs text-amber-200">
                    <div className="flex items-center gap-2 font-bold text-amber-300">
                      <Sparkles className="h-4 w-4" />
                      {t.otpDemoTitle}
                    </div>
                    <p className="mt-1">
                      {t.otpDemoBody}{' '}
                      <span
                        data-testid="demo-otp-code"
                        className="ml-1 rounded bg-black/40 px-2 py-0.5 font-mono text-base font-extrabold tracking-widest text-white"
                      >
                        {challenge.dev_otp_preview}
                      </span>
                    </p>
                  </div>
                )}

                {/* Campo único OTP accesible (compatible con autocompletado nativo one-time-code) */}
                <div className="flex flex-col items-center py-2">
                  <input
                    ref={otpInputRef}
                    id="voter-otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="\d{4}"
                    maxLength={4}
                    enterKeyHint="done"
                    required
                    aria-labelledby="auth-modal-title"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'voter-otp-error' : undefined}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-56 rounded-2xl border-2 border-white/20 bg-black/50 px-4 py-3.5 text-center font-mono text-3xl font-extrabold tracking-[0.55em] text-white placeholder:tracking-[0.45em] placeholder:text-slate-600 transition focus:border-amber-400"
                  />
                </div>

                {expiresSecondsLeft === 0 && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-amber-400/40 bg-amber-400/15 p-3 text-xs text-amber-100"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <span>{t.otpExpiredError}</span>
                  </div>
                )}

                {error && (
                  <div
                    id="voter-otp-error"
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
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-sky-300 px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:brightness-105 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.verifyingOtpBtn}
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      {t.verifyOtpBtn}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setStep('identity');
                    }}
                    className="underline-offset-2 hover:text-white hover:underline"
                  >
                    {t.changeDataBtn}
                  </button>

                  <button
                    type="button"
                    disabled={cooldownSecondsLeft > 0 || loading}
                    onClick={() => handleRequestOtp()}
                    className="inline-flex items-center gap-1.5 font-semibold text-sky-300 transition hover:text-sky-200 disabled:text-slate-500"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {cooldownSecondsLeft > 0
                      ? t.resendInBtn(cooldownSecondsLeft)
                      : t.resendBtn}
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
                    {t.voteSuccessTitle}
                  </h2>
                  <p className="mt-1 text-xs text-slate-300">
                    {t.voteSuccessSubtitle(receipt.curso)}
                  </p>
                </div>

                {/* Código / Hash único de auditoría ciudadana */}
                <div className="rounded-2xl border border-indigo-400/35 bg-indigo-500/10 p-4 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-200">
                      <Fingerprint className="h-4 w-4 text-indigo-300" />
                      <span>{t.auditCodeTitle}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAuditHash}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-300/30 bg-indigo-500/20 px-2.5 py-1 text-[11px] font-bold text-indigo-100 transition hover:bg-indigo-500/30"
                    >
                      {copiedAudit ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-300" />
                          <span>{t.auditCopiedBtn}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>{t.auditCopyBtn}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p
                    data-testid="vote-audit-hash"
                    className="mt-2 select-all rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-center font-mono text-sm font-extrabold tracking-widest text-amber-300 sm:text-base"
                  >
                    {receipt.audit_hash}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
                    {t.auditCodeSubtitle}
                  </p>

                  {/* Envío opcional de resguardo y hash de auditoría al correo */}
                  <div className="mt-3 border-t border-white/10 pt-3">
                    {receiptSentEmail ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3 py-2 text-[11px] font-semibold text-emerald-200">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" />
                        <span>{t.receiptEmailSentBadge(receiptSentEmail)}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendReceiptEmail}
                        disabled={sendingReceipt}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-300/35 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-60"
                      >
                        {sendingReceipt ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Mail className="h-3.5 w-3.5 text-amber-300" />
                        )}
                        <span>
                          {sendingReceipt ? t.sendingReceiptEmailBtn : t.sendReceiptEmailBtn}
                        </span>
                      </button>
                    )}

                    {receiptSendError && (
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-300">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{receiptSendError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {t.savedOrderTitle}
                  </p>
                  <ol className="space-y-1.5 text-sm">
                    {receipt.rankedMovies.map((m, idx) => (
                      <li key={m.id} className="flex items-center justify-between">
                        <span className="text-slate-100">
                          <strong className="mr-2 font-mono text-amber-300">
                            {t.rankOrdinal(idx + 1)}
                          </strong>
                          {getLocalizedMovie(m, lang).title}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Explicación didáctica: por qué es vital poder auditar el voto en democracia */}
                <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200">
                    <BookOpen className="h-4 w-4 shrink-0 text-amber-300" />
                    <span>{t.didacticAuditTitle}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-200">
                    {t.didacticAuditBody}
                  </p>
                </div>

                {/* Coletilla legal RGPD / LOPDGDD al finalizar y cerrar sesión */}
                <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3.5 text-left">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>{t.gdprTitle}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-200">
                    {t.gdprLogoutNotice}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      const hashToCheck = receipt.audit_hash;
                      onVoterLogout();
                      onViewStandings(hashToCheck);
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-sky-400/40 bg-sky-500/15 px-4 py-3 text-xs font-bold text-sky-100 transition hover:bg-sky-500/25"
                  >
                    <BarChart3 className="h-4 w-4 text-sky-300" />
                    {t.viewStandingsAfterVoteBtn}
                  </button>
                  <button
                    type="button"
                    onClick={onVoterLogout}
                    className="inline-flex flex-[1.3] items-center justify-center gap-1.5 rounded-2xl bg-white px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg transition hover:bg-slate-200"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.logoutVoterBtn}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
