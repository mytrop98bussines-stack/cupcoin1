import { useState } from "react";
import { Shield, AlertTriangle, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { restoreWalletFromMnemonic } from "@/lib/wallet/walletService";
import { getStoredWalletAddress }    from "@/lib/wallet/walletStorage";

interface WalletRecoveryModalProps {
  expectedAddress: string;   // La dirección que está en Firestore
  onRecovered:     () => void;
  onSkip:          () => void;
}

export function WalletRecoveryModal({
  expectedAddress,
  onRecovered,
  onSkip,
}: WalletRecoveryModalProps) {
  const [mnemonic, setMnemonic]       = useState("");
  const [password, setPassword]       = useState("");
  const [showPwd, setShowPwd]         = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  const handleRecover = async () => {
    if (!mnemonic.trim() || !password) return;

    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12) {
      setError("La frase semilla debe tener exactamente 12 palabras");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const walletData = await restoreWalletFromMnemonic(
        mnemonic.trim(),
        password
      );

      // Verificar que la dirección coincide con la de Firestore
      if (
        walletData.address.toLowerCase() !==
        expectedAddress.toLowerCase()
      ) {
        setError(
          "Esta frase no corresponde a tu wallet. " +
          "Verifica que estés usando las 12 palabras correctas."
        );
        return;
      }

      setSuccess(true);
      setTimeout(() => onRecovered(), 1500);

    } catch (err) {
      setError("Frase semilla inválida. Verifica las 12 palabras.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">

        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Recupera tu Wallet
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  Tu wallet existe pero no está en este dispositivo
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">

          {/* Dirección esperada */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
              Tu dirección en Firestore
            </p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {expectedAddress}
            </p>
          </div>

          {/* Explicación */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
            <AlertTriangle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
              Tu wallet fue creada en otro dispositivo. Para acceder
              necesitas ingresar tus <strong>12 palabras semilla</strong>
              que anotaste al registrarte.
            </p>
          </div>

          {/* Input frase semilla */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Tus 12 palabras semilla
            </label>
            <textarea
              value={mnemonic}
              onChange={(e) => {
                setMnemonic(e.target.value);
                if (error) setError(null);
              }}
              placeholder="palabra1 palabra2 palabra3 ... palabra12"
              rows={3}
              className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none font-mono"
            />
            {mnemonic && (
              <p className={`text-[10px] mt-1 font-semibold ${
                mnemonic.trim().split(/\s+/).length === 12
                  ? "text-emerald-500"
                  : "text-gray-400"
              }`}>
                {mnemonic.trim().split(/\s+/).length}/12 palabras
              </p>
            )}
          </div>

          {/* Password para cifrar en este dispositivo */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
              Tu contraseña de CubaX
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Para cifrar la wallet en este dispositivo"
                className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPwd
                  ? <EyeOff className="h-4 w-4" />
                  : <Eye    className="h-4 w-4" />
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-700 dark:text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
              <Shield className="h-4 w-4 text-emerald-500" />
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                ✅ Wallet recuperada correctamente
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="space-y-2">
            <Button
              size="lg"
              fullWidth
              loading={loading}
              disabled={
                mnemonic.trim().split(/\s+/).length !== 12 ||
                !password ||
                success
              }
              onClick={handleRecover}
            >
              Recuperar Wallet
            </Button>

            <button
              onClick={onSkip}
              className="w-full text-xs text-gray-400 font-semibold text-center py-2 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Continuar sin recuperar (solo lectura)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
