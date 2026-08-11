import { useState } from "react";
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { loadWalletPrivateKey }    from "@/lib/wallet/walletStorage";
import { getAllAddresses }          from "@/lib/wallet/walletService";
import { saveWalletAddresses }      from "@/lib/wallet/walletStorage";

interface Props {
  onClose:       () => void;
  onRegenerated: () => void;
}

export function RegenerateAddressesModal({ onClose, onRegenerated }: Props) {
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [newAddresses, setNewAddresses] = useState<{
    evm: string; tron: string; bitcoin: string;
  } | null>(null);

  const handleRegenerate = async () => {
    if (!password) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Descifrar wallet con la contraseña
      const walletData = await loadWalletPrivateKey(password);

      if (!walletData) {
        setError("Contraseña incorrecta. Intenta de nuevo.");
        return;
      }

      // 2. Derivar todas las direcciones desde el mnemonic
      const addresses = await getAllAddresses(walletData.mnemonic);

      if (!addresses.evm) {
        setError("Error derivando direcciones. Intenta de nuevo.");
        return;
      }

      // 3. Guardar en localStorage
      saveWalletAddresses(addresses);

      setNewAddresses(addresses);
      setSuccess(true);
      console.log("✅ Direcciones regeneradas:", addresses);

    } catch (err: any) {
      console.error("❌ Error:", err);
      setError(err?.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">

        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Activar Tron y Bitcoin
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Deriva las direcciones desde tu frase semilla
                </p>
              </div>
            </div>
            {!loading && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="p-5 space-y-4">

          {!success ? (
            <>
              {/* Explicación */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
                <AlertTriangle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                  Tu wallet fue creada antes de agregar soporte para
                  <strong> Tron</strong> y <strong>Bitcoin</strong>.
                  Ingresa tu contraseña para derivar esas direcciones
                  desde tu frase semilla existente.
                  <br /><br />
                  <strong>No se cambia nada</strong>, solo se calculan
                  las direcciones adicionales.
                </p>
              </div>

              {/* Input contraseña */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Tu contraseña de CubaX
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ingresa tu contraseña"
                    className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 pr-10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && password) handleRegenerate();
                    }}
                    autoFocus
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
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-[11px] text-red-700 dark:text-red-400">
                    {error}
                  </p>
                </div>
              )}

              {/* Botón */}
              <button
                disabled={!password || loading}
                onClick={handleRegenerate}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold disabled:opacity-40 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Derivando direcciones...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Activar Tron y Bitcoin
                  </>
                )}
              </button>
            </>
          ) : (
            // ─── SUCCESS ──────────────────────────────────
            <div className="space-y-4">
              <div className="text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                  ¡Direcciones activadas!
                </h3>
                <p className="text-xs text-gray-400">
                  Ahora puedes recibir y enviar en Tron y Bitcoin
                </p>
              </div>

              {newAddresses && (
                <div className="space-y-2">
                  {/* EVM */}
                  <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <p className="text-[10px] font-bold text-purple-500 uppercase mb-1">
                      🔷 EVM (Polygon · ETH · BSC)
                    </p>
                    <p className="text-[10px] font-mono text-gray-600 dark:text-gray-300 break-all">
                      {newAddresses.evm}
                    </p>
                  </div>

                  {/* Tron */}
                  {newAddresses.tron && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                      <p className="text-[10px] font-bold text-red-500 uppercase mb-1">
                        🔴 Tron (TRC20)
                      </p>
                      <p className="text-[10px] font-mono text-gray-600 dark:text-gray-300 break-all">
                        {newAddresses.tron}
                      </p>
                    </div>
                  )}

                  {/* Bitcoin */}
                  {newAddresses.bitcoin && (
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <p className="text-[10px] font-bold text-orange-500 uppercase mb-1">
                        🟠 Bitcoin (Native SegWit)
                      </p>
                      <p className="text-[10px] font-mono text-gray-600 dark:text-gray-300 break-all">
                        {newAddresses.bitcoin}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  onRegenerated();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-sm font-bold transition-colors"
              >
                Continuar →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
    }
