import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Send, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com";

interface Props {
  uid: string;
  onVerified: () => void;
}

export function PhoneVerificationModal({ uid, onVerified }: Props) {
  const [loading, setLoading]   = useState(false);
  const [botUrl, setBotUrl]     = useState<string | null>(null);
  const [code, setCode]         = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);

  // ─── Generar código y abrir Telegram ──────────────────
  const handleStartVerification = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res = await fetch(`${BACKEND_URL}/api/auth/phone/generate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();

      if (data.success && data.botUrl) {
        setBotUrl(data.botUrl);
        setCode(data.code);
        window.open(data.botUrl, "_blank");
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Polling cada 3 seg para detectar verificación ────
  useEffect(() => {
    if (!botUrl || verified) return;

    setChecking(true);
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("cubax_token");
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ uid }),
        });
        const data = await res.json();

        if (data.success && data.userData?.phoneVerified === true) {
          setVerified(true);
          clearInterval(interval);
          setTimeout(() => onVerified(), 1500);
        }
      } catch {
        /* Reintenta silenciosamente */
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [botUrl, verified, uid, onVerified]);

  // ─── UI de éxito ──────────────────────────────────────
  if (verified) {
    return (
      <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl text-center space-y-4">
        <div className="h-14 w-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          ¡Teléfono Verificado!
        </h3>
        <p className="text-xs text-gray-400">
          Tu cuenta ahora está completamente protegida.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl text-center space-y-4">
      <div className="h-14 w-14 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto text-sky-500">
        <Send className="h-7 w-7" />
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        Verificar Teléfono
      </h3>
      <p className="text-xs text-gray-400 leading-relaxed">
        Para garantizar la seguridad y evitar cuentas duplicadas, verifica tu número en 1 click usando nuestro Bot oficial de Telegram.
      </p>

      {botUrl ? (
        <div className="space-y-3">
          <a
            href={botUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
          >
            Abrir Bot en Telegram <ExternalLink className="h-4 w-4" />
          </a>

          {code && (
            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10">
              <p className="text-[10px] text-gray-400 mb-1">Tu código único:</p>
              <p className="text-sm font-mono font-bold text-gray-900 dark:text-white tracking-wider">
                {code}
              </p>
            </div>
          )}

          {checking && (
            <div className="flex items-center justify-center gap-2 text-[11px] text-sky-500 font-medium">
              <Loader2 className="h-3 w-3 animate-spin" />
              Esperando confirmación de Telegram...
            </div>
          )}

          <p className="text-[10px] text-gray-400">
            1. Abre Telegram → 2. Presiona "Iniciar" → 3. Comparte tu contacto
          </p>
        </div>
      ) : (
        <Button
          size="lg"
          fullWidth
          loading={loading}
          onClick={handleStartVerification}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          Iniciar Verificación Gratis
        </Button>
      )}
    </div>
  );
}