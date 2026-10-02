import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Wallet, Copy, ArrowUpRight, ArrowDownLeft,
  Shield, Loader2, Check, Eye, EyeOff, RefreshCw,
  AlertTriangle, X, Sparkles, ArrowRight, Info, CheckCircle2,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com";

const getToken = (): string | null => localStorage.getItem("cubax_token");

export function WalletPage() {
  const {
    user,
    custodialAddress,
    usdtBalance,
    walletHistory,
    walletLoading,
    loadCustodialWallet,
    fetchWalletHistory,
    setModalOpen,
  } = useAppStore();

  const [hideBalances, setHideBalances]     = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [activeAction, setActiveAction]     = useState<"deposit" | "withdraw" | null>(null);

  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount]   = useState("");
  const [isSubmitting, setIsSubmitting]       = useState(false);
  
  const [withdrawStep, setWithdrawStep]       = useState<1 | 2 | 3>(1);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawTxId, setWithdrawTxId]       = useState("");
  const [withdrawError, setWithdrawError]     = useState<string | null>(null);

  // Cargar balance custodial e historial al renderizar
  useEffect(() => {
    if (user?.uid) {
      loadCustodialWallet();
    }
  }, [user, loadCustodialWallet]);

  useEffect(() => {
    setModalOpen(activeAction !== null);
    return () => setModalOpen(false);
  }, [activeAction, setModalOpen]);

  const handleRefresh = useCallback(async () => {
    if (user?.uid) {
      await loadCustodialWallet();
    }
  }, [user, loadCustodialWallet]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetMaxAmount = () => {
    setWithdrawAmount(String(usdtBalance));
  };

  const handleExecuteWithdrawal = async () => {
    if (!withdrawAddress || !withdrawAmount || !user?.uid) return;

    if (!withdrawAddress.startsWith("T")) {
      setWithdrawError("La dirección debe ser TRC20 y empezar con T (Red TRON).");
      return;
    }

    const monto = parseFloat(withdrawAmount);

    if (monto <= 0 || monto > usdtBalance) {
      setWithdrawError("Monto inválido o saldo insuficiente.");
      return;
    }
    
    if (monto < 1) {
      setWithdrawError("El monto mínimo de retiro es 1 USDT.");
      return;
    }

    setIsSubmitting(true);
    setWithdrawError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/tron/withdraw`, {
        method:  "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getToken()}`
        },
        body:    JSON.stringify({ uid: user.uid, toAddress: withdrawAddress, amount: monto }),
      });
      const data = await res.json();

      if (data.success) {
        setWithdrawSuccess(true);
        setWithdrawTxId(data.txHash || data.txId || "");
        setWithdrawStep(3);
        // Refrescar balance después de retirar exitosamente
        void loadCustodialWallet();
      } else {
        setWithdrawError(data.error || data.message || "Error procesando el retiro.");
      }
    } catch (err) {
      setWithdrawError("Error de conexión con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAction = () => {
    setActiveAction(null);
    setWithdrawStep(1);
    setWithdrawSuccess(false);
    setWithdrawAddress("");
    setWithdrawAmount("");
    setWithdrawError(null);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4 animate-fade-in">
      
      {/* ═══ HEADER ══════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Mi Wallet</h1>
            <p className="text-[10px] text-gray-400 font-medium">Custodia Segura CubaX</p>
          </div>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={walletLoading}
          className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${walletLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ═══ BALANCE CARD (Enfocado en USDT) ══════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-gray-900 to-gray-800 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.02] p-6 border border-emerald-500/10 dark:border-white/[0.08] shadow-2xl">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Balance Custodiado (Tron)</span>
            </div>
            <button onClick={() => setHideBalances(!hideBalances)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors">
              {hideBalances ? <><Eye className="h-3.5 w-3.5" /> Mostrar</> : <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>}
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-white tracking-tight leading-none">
                {hideBalances ? "••••••" : `${usdtBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </p>
              <span className="text-emerald-400 font-bold text-lg">USDT</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-medium">≈ 1.00 USD por Tether</p>
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => setActiveAction("deposit")} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]">
              <ArrowDownLeft className="h-4 w-4" /> Depositar
            </button>
            <button onClick={() => setActiveAction("withdraw")} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all backdrop-blur-sm active:scale-[0.98]">
              <ArrowUpRight className="h-4 w-4" /> Retirar
            </button>
          </div>
        </div>
      </div>

      {/* ═══ DIRECCIÓN CUSTODIAL ACTUAL ══════════════════ */}
      <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-2xl p-4">
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Tu Dirección USDT (TRC-20)</p>
        {walletLoading ? (
          <div className="h-5 w-2/3 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        ) : custodialAddress ? (
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-white/5 rounded-xl px-3 py-2 border border-gray-200 dark:border-white/10">
            <span className="text-xs font-mono text-gray-600 dark:text-gray-300 truncate select-all">{custodialAddress}</span>
            <button onClick={() => handleCopyAddress(custodialAddress)} className="text-emerald-500 hover:opacity-80 transition-opacity">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        ) : (
          <p className="text-xs text-red-400">Error cargando dirección de depósito.</p>
        )}
      </div>

      {/* ═══ MODAL DEPÓSITO ══════════════════════════════ */}
      {activeAction === "deposit" && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Depositar USDT</h3>
                  <p className="text-[10px] text-gray-400">Envía fondos a tu cuenta CubaX</p>
                </div>
              </div>
              <button onClick={handleCloseAction} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <span className="text-sm">🔴</span>
              <div>
                <p className="text-xs font-bold text-red-600 dark:text-red-400">Red Requerida: Tron (TRC-20)</p>
                <p className="text-[10px] text-gray-400">El envío de fondos por otras redes (ERC-20, BSC, Solana) causará la pérdida permanente de los mismos.</p>
              </div>
            </div>

            {walletLoading ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                <p className="text-xs text-gray-400 font-medium">Obteniendo dirección segura...</p>
              </div>
            ) : custodialAddress ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(custodialAddress)}&format=svg`} 
                      alt="QR Deposit" 
                      className="w-40 h-40" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dirección de Destino</label>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10">
                    <span className="text-[11px] font-mono text-gray-600 dark:text-gray-300 flex-1 truncate select-all">{custodialAddress}</span>
                    <button 
                      onClick={() => handleCopyAddress(custodialAddress)} 
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${copied ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"}`}
                    >
                      {copied ? <><Check className="h-3 w-3" /> Copiado</> : <><Copy className="h-3 w-3" /> Copiar</>}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No se pudo recuperar la wallet</p>
                <button onClick={loadCustodialWallet} className="text-xs font-bold text-emerald-500 mt-2">Reintentar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL RETIRO ════════════════════════════════ */}
      {activeAction === "withdraw" && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Retirar USDT</h3>
                  <p className="text-[10px] text-gray-400">Retira fondos a una wallet externa</p>
                </div>
              </div>
              <button onClick={handleCloseAction} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {!withdrawSuccess && (
              <div className="flex items-center gap-2">
                {[1, 2].map((step) => (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${withdrawStep >= step ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-400"}`}>{step}</div>
                    <span className={`text-[10px] font-semibold ${withdrawStep >= step ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>{step === 1 ? "Dirección" : "Monto"}</span>
                    {step < 2 && <div className={`flex-1 h-0.5 rounded-full ${withdrawStep > step ? "bg-red-500" : "bg-gray-200 dark:bg-white/10"}`} />}
                  </div>
                ))}
              </div>
            )}

            {withdrawStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/5">
                  <span className="text-xl">🔴</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Red Tron (TRC-20)</p>
                    <p className="text-[10px] text-gray-400">Comisión fija de red: ~1 USDT · Tiempo: ~1 min</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Dirección USDT de Destino (TRC-20)</label>
                  <input 
                    type="text" 
                    value={withdrawAddress} 
                    onChange={(e) => setWithdrawAddress(e.target.value)} 
                    placeholder="T..." 
                    className="w-full text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all font-mono" 
                  />
                  {withdrawAddress && !withdrawAddress.startsWith("T") && (
                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Debe ser una red Tron válida (empieza por T)</p>
                  )}
                </div>

                <button 
                  disabled={!withdrawAddress || !withdrawAddress.startsWith("T")} 
                  onClick={() => setWithdrawStep(2)} 
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold disabled:opacity-40 transition-all"
                >
                  Continuar <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {withdrawStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10">
                  <span className="text-lg">🔴</span>
                  <div className="flex-1 truncate">
                    <p className="text-[11px] font-bold text-gray-900 dark:text-white">Red Tron (TRC-20)</p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">{withdrawAddress}</p>
                  </div>
                  <button onClick={() => setWithdrawStep(1)} className="text-[10px] text-emerald-500 font-bold">Editar</button>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Monto a retirar</label>
                    <button onClick={handleSetMaxAmount} className="text-[10px] font-bold text-red-500">MAX: {usdtBalance} USDT</button>
                  </div>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value)} 
                      placeholder="0.00" 
                      min="1" 
                      className="w-full text-2xl font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 pr-20 text-gray-900 dark:text-white focus:outline-none" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">USDT</span>
                  </div>
                  {withdrawAmount && parseFloat(withdrawAmount) > usdtBalance && (
                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Saldo insuficiente custodidado</p>
                  )}
                </div>

                {withdrawError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 text-xs text-red-700 dark:text-red-400">{withdrawError}</div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => setWithdrawStep(1)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold">Atrás</button>
                  <button 
                    disabled={isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) < 1 || parseFloat(withdrawAmount) > usdtBalance} 
                    onClick={handleExecuteWithdrawal} 
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 text-white text-xs font-bold disabled:opacity-40 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Shield className="h-3.5 w-3.5" /> Confirmar Retiro</>}
                  </button>
                </div>
              </div>
            )}

            {withdrawStep === 3 && withdrawSuccess && (
              <div className="py-6 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">¡Retiro Ejecutado con Éxito!</h3>
                <p className="text-xs text-gray-400">Los fondos están siendo transferidos por la blockchain.</p>
                {withdrawTxId && (
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border text-center border-gray-150 dark:border-white/10">
                    <p className="text-[10px] text-gray-400">Hash de Transacción (TXID)</p>
                    <p className="text-[11px] font-mono text-gray-600 dark:text-gray-300 break-all select-all">{withdrawTxId}</p>
                    <a 
                      href={`https://tronscan.org/#/transaction/${withdrawTxId}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] font-bold text-emerald-500 block mt-2 hover:underline"
                    >
                      Ver en TronScan →
                    </a>
                  </div>
                )}
                <button onClick={handleCloseAction} className="w-full py-3 rounded-xl bg-gray-900 text-white text-xs font-bold hover:opacity-90">
                  Volver a Mi Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ HISTORIAL DE TRANSACCIONES REALES ═══════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Historial de Transacciones</h2>
          <span className="text-[10px] text-gray-400 font-medium">Reales (TRC-20)</span>
        </div>

        <div className="space-y-2">
          {walletLoading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              <p className="text-xs text-gray-400">Sincronizando transacciones...</p>
            </div>
          ) : walletHistory.length > 0 ? (
            walletHistory.map((tx: any, idx: number) => {
              const isDeposit = tx.to?.toLowerCase() === custodialAddress?.toLowerCase();
              return (
                <div 
                  key={tx.id || tx.txID || idx} 
                  className="flex items-center justify-between p-4 bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-xl hover:scale-[1.01] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isDeposit ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                      {isDeposit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {isDeposit ? "Depósito Recibido" : "Retiro Enviado"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : "Confirmada"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs font-bold ${isDeposit ? "text-emerald-500" : "text-gray-900 dark:text-white"}`}>
                      {isDeposit ? "+" : "-"}{parseFloat(tx.amount || tx.value || 0).toFixed(2)} USDT
                    </p>
                    <span className="text-[9px] text-gray-400 font-mono">TRC-20</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-10 text-center bg-white dark:bg-white/[0.02] border rounded-2xl">
              <p className="text-xs text-gray-400">Aún no tienes movimientos en tu cuenta.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ INFO BANNER ═════════════════════════════════ */}
      <div className="flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Info className="h-4 w-4 text-emerald-500" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-900 dark:text-white mb-0.5">Seguridad y Velocidad CubaX</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Tus fondos están custodiados en wallets multifirma del ecosistema. Los depósitos se acreditan de forma inmediata tras 1 confirmación en la blockchain de TRON. Las comisiones están optimizadas mediante TronGrid.
          </p>
        </div>
      </div>
    </div>
  );
                        }
