import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import {
  X, Mail, CheckCircle2, AlertTriangle,
  Loader2, RefreshCw,
} from "lucide-react";
import emailjs from "@emailjs/browser";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

// ─── Configuración EmailJS ──────────────────────────────
const EMAILJS_SERVICE_ID  = "service_juidf7j";
const EMAILJS_TEMPLATE_ID = "template_zjcqvlp";
const EMAILJS_PUBLIC_KEY = "PBxqd6if2L_r8Kr9C";

// 🆕 Inicializar EmailJS al cargar el módulo
emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

interface EmailVerificationModalProps {
  email:       string;
  onClose:     () => void;
  onVerified?: () => void;
}

export function EmailVerificationModal({
  email,
  onClose,
  onVerified,
}: EmailVerificationModalProps) {
  const [code, setCode]             = useState("");
  const [loading, setLoading]       = useState(false);
  const [sending, setSending]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [success, setSuccess]       = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeSent, setCodeSent]     = useState(false);

  // ─── Enviar código automáticamente al abrir ──────────────
  useEffect(() => {
    void handleSendCode();
  }, []);

  // ─── Countdown del resend ────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // ─── Enviar código ───────────────────────────────────────
  const handleSendCode = async () => {
    setSending(true);
    setError(null);

    try {
      // 1. Pedir código al backend (para que lo genere y guarde)
      console.log("📧 [1/2] Pidiendo código al backend...");
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/auth/email/send-code`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log("📧 [1/2] Respuesta backend:", data);

      if (data.code === "ALREADY_VERIFIED") {
        setSuccess(true);
        setTimeout(() => {
          onVerified?.();
          onClose();
        }, 1500);
        return;
      }

      if (data.code === "COOLDOWN") {
        setError(data.error);
        const match = data.error.match(/(\d+)/);
        if (match) setResendCooldown(parseInt(match[1]));
        return;
      }

      if (!data.success || !data.code) {
        setError(data.error || "Error generando código");
        return;
      }

      // 2. Enviar el email vía EmailJS
      console.log("📧 [2/2] Enviando email vía EmailJS...");
      const userName = localStorage.getItem("cubax_name") || "Usuario";

      const emailjsResponse = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:   email,
          to_name:    userName,
          from_email: "mytrop98bussines@gmail.com",
          code:       data.code,
        }
      );

      console.log("✅ [2/2] Email enviado:", emailjsResponse);

      setCodeSent(true);
      setResendCooldown(60);
    } catch (err: any) {
      console.error("❌ [EmailJS] Error completo:", err);
      console.error("❌ [EmailJS] Text:", err?.text);
      console.error("❌ [EmailJS] Status:", err?.status);
      setError(err?.text || err?.message || "Error enviando email");
    } finally {
      setSending(false);
    }
  };

  // ─── Verificar código ────────────────────────────────────
  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Ingresa el código completo de 6 dígitos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/auth/email/verify-code`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onVerified?.();
          onClose();
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // Enmascarar email (juan****@gmail.com)
  const maskedEmail = (() => {
    const [name, domain] = email.split("@");
    if (!domain) return email;
    const visible = name.slice(0, Math.min(3, name.length));
    return `${visible}${"*".repeat(Math.max(3, name.length - 3))}@${domain}`;
  })();

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up">

        {success ? (
          <div className="p-8 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto animate-scale-in">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                ¡Email verificado!
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Ya puedes operar sin restricciones en CupCoin.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="relative p-6 pb-4 bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                <Mail className="h-8 w-8" />
              </div>

              <h2 className="text-xl font-black mb-1">
                Verifica tu email
              </h2>
              <p className="text-sm text-white/80">
                Enviamos un código a:
              </p>
              <p className="text-sm font-bold mt-1">
                {maskedEmail}
              </p>
            </div>

            <div className="p-6 space-y-4">

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-400 flex-1">
                    {error}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-center">
                  Código de verificación
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="000000"
                  value={code}
                  maxLength={6}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setCode(val);
                    if (error) setError(null);
                  }}
                  className="w-full px-4 py-4 text-center text-3xl font-black tracking-[0.5em] rounded-2xl border-2 border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  autoFocus
                />
              </div>

              <Button
                size="lg"
                fullWidth
                loading={loading}
                disabled={code.length !== 6}
                onClick={handleVerify}
                className="bg-brand-500 hover:bg-brand-600 shadow-lg"
                icon={<CheckCircle2 className="h-4 w-4" />}
              >
                Verificar código
              </Button>

              <button
                onClick={handleSendCode}
                disabled={sending || resendCooldown > 0}
                className="w-full flex items-center justify-center gap-2 text-xs text-brand-500 font-bold py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {resendCooldown > 0
                  ? `Reenviar en ${resendCooldown}s`
                  : sending
                  ? "Enviando..."
                  : codeSent ? "Reenviar código" : "Enviar código"}
              </button>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-[11px] text-blue-700 dark:text-blue-400 text-center leading-relaxed">
                  💡 Revisa tu bandeja de entrada y la carpeta de spam.
                  El código expira en 15 minutos.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
