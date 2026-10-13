import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Send, CheckCircle2, Loader2, ExternalLink } from "lucide-react";

export function PhoneVerificationModal({ uid, onVerified }: { uid: string; onVerified: () => void }) {
  const [loading, setLoading] = useState(false);
  const [botUrl, setBotUrl] = useState<string | null>(null);

  const handleStartVerification = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://cubax-backend.onrender.com/api/auth/phone/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();

      if (data.success && data.botUrl) {
        setBotUrl(data.botUrl);
        // Abrir Telegram directamente
        window.open(data.botUrl, "_blank");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl max-w-sm mx-auto text-center space-y-4">
      <div className="h-14 w-14 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto text-sky-500">
        <Send className="h-7 w-7" />
      </div>

      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verificar Teléfono</h3>
      <p className="text-xs text-gray-400">
        Para garantizar la seguridad y evitar cuentas duplicadas en Cuba, verifica tu número en 1 segundo usando nuestro Bot oficial de Telegram.
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
          <p className="text-[11px] text-gray-400 animate-pulse">
            Esperando confirmación desde Telegram...
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