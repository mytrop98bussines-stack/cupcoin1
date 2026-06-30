import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/firebase/config";
import {
  doc, getDoc, updateDoc, addDoc,
  collection, onSnapshot,
} from "firebase/firestore";
import {
  Crown, CheckCircle2, Clock, AlertTriangle,
  Wallet, Smartphone, RefreshCw, X, Upload,
  Calendar, Shield, Zap, Info,
} from "lucide-react";
import type { MembershipPayment, AppConfig } from "@/types";

const CLOUDINARY_CLOUD_NAME    = "dc4caibrn";
const CLOUDINARY_UPLOAD_PRESET = "cubax_unsigned";

export function MembershipPage() {
  const { user, navigate } = useAppStore();

  const [config, setConfig]               = useState<AppConfig["membership"] | null>(null);
  const [payments, setPayments]           = useState<MembershipPayment[]>([]);
  const [loading, setLoading]             = useState(true);
  const [payMethod, setPayMethod]         = useState<"wallet" | "transfermovil" | "enzona" | null>(null);
  const [reference, setReference]         = useState("");
  const [screenshot, setScreenshot]       = useState<string | null>(null);
  const [uploadingImg, setUploadingImg]   = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [success, setSuccess]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // ─── Cargar config de membresía ───────────────────────────
  useEffect(() => {
    const configRef = doc(db, "config", "membership");
    const unsub = onSnapshot(configRef, (snap) => {
      if (snap.exists()) {
        setConfig(snap.data() as AppConfig["membership"]);
      } else {
        // Config por defecto si no existe
        setConfig({
          priceCUP:       100,
          priceUSDT:      0.25,
          freeTrialDays:  30,
          graceDays:      3,
          warnDaysBefore: 3,
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ─── Cargar historial de pagos ────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    const q = collection(db, "membership_payments");
    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      () => {}
    );
    return () => unsub();
  }, [user?.uid]);

  if (!user) return null;

  const membership   = (user as any).membership;
  const now          = Date.now();
  const expiresAt    = membership?.expiresAt || 0;
  const daysLeft     = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
  const isActive     = membership?.status === "active" ||
                       membership?.status === "free_trial" ||
                       membership?.status === "manual";
  const isExpired    = !isActive || expiresAt < now;
  const isFreeTrial  = membership?.status === "free_trial";
  const isWarning    = daysLeft <= 3 && daysLeft > 0 && isActive;

  // ─── Estado de la membresía ───────────────────────────────
  const getMembershipBadge = () => {
    if (!membership || isExpired) {
      return { label: "Sin membresía", variant: "danger" as const, icon: <X className="h-3 w-3" /> };
    }
    if (isFreeTrial) {
      return { label: "Prueba gratuita", variant: "info" as const, icon: <Zap className="h-3 w-3" /> };
    }
    if (membership.status === "manual") {
      return { label: "Cortesía admin", variant: "success" as const, icon: <Crown className="h-3 w-3" /> };
    }
    if (isWarning) {
      return { label: `Vence en ${daysLeft} días`, variant: "warning" as const, icon: <AlertTriangle className="h-3 w-3" /> };
    }
    return { label: "Activa", variant: "success" as const, icon: <CheckCircle2 className="h-3 w-3" /> };
  };

  const badge = getMembershipBadge();

  // ─── Subir screenshot a Cloudinary ───────────────────────
  const handleScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImg(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", `cubax/membership/${user.uid}`);

      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      setScreenshot(data.secure_url);
    } catch (err: any) {
      setError("Error subiendo la imagen: " + err.message);
    } finally {
      setUploadingImg(false);
    }
  };

  // ─── Pagar con USDT del wallet ────────────────────────────
  const handlePayWithWallet = async () => {
    if (!config || !user) return;

    const balance = (user as any).balances?.USDT || 0;
    if (balance < config.priceUSDT) {
      setError(
        `Saldo insuficiente. Tienes ${balance} USDT y necesitas ${config.priceUSDT} USDT.`
      );
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now      = Date.now();
      const period   = new Date().toISOString().slice(0, 7);
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 días

      // Descontar saldo
      await updateDoc(doc(db, "users", user.uid), {
        "balances.USDT": balance - config.priceUSDT,
        membership: {
          status:      "active",
          startedAt:   now,
          expiresAt,
          plan:        "monthly",
          lastPayment: now,
        },
      });

      // Registrar pago
      await addDoc(collection(db, "membership_payments"), {
        userId:    user.uid,
        userName:  user.displayName,
        amount:    config.priceUSDT,
        currency:  "USDT",
        method:    "wallet_usdt",
        status:    "completed",
        period,
        createdAt: now,
      });

      // Notificar al usuario
      await addDoc(collection(db, "notifications"), {
        userId:    user.uid,
        title:     "✅ Membresía activada",
        body:      `Tu membresía mensual está activa hasta ${new Date(expiresAt).toLocaleDateString("es-CU")}.`,
        type:      "membership",
        read:      false,
        createdAt: now,
      });

      setSuccess(true);
      setPayMethod(null);
    } catch (err: any) {
      setError("Error procesando el pago: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Enviar comprobante Transfermóvil/Enzona ──────────────
  const handlePayWithMobile = async () => {
    if (!config || !user || !payMethod) return;

    if (!reference.trim()) {
      setError("Ingresa el número de referencia del pago.");
      return;
    }

    if (!screenshot) {
      setError("Sube una captura de pantalla del pago.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now    = Date.now();
      const period = new Date().toISOString().slice(0, 7);

      // Registrar pago pendiente de aprobación
      await addDoc(collection(db, "membership_payments"), {
        userId:     user.uid,
        userName:   user.displayName,
        amount:     config.priceCUP,
        currency:   "CUP",
        method:     payMethod === "transfermovil" ? "transfermovil" : "enzona",
        status:     "pending",
        reference:  reference.trim(),
        screenshot,
        period,
        createdAt:  now,
      });

      // Notificar al admin
      await addDoc(collection(db, "system_alerts"), {
        tipo:        "membership_payment_pending",
        descripcion: `${user.displayName} envió comprobante de membresía por ${payMethod}.`,
        userId:      user.uid,
        userName:    user.displayName,
        method:      payMethod,
        reference:   reference.trim(),
        screenshot,
        timestamp:   now,
        severidad:   "baja",
        resuelto:    false,
      });

      // Notificar al usuario
      await addDoc(collection(db, "notifications"), {
        userId:    user.uid,
        title:     "⏳ Pago en revisión",
        body:      "Tu comprobante de pago fue enviado. El admin lo revisará en breve.",
        type:      "membership",
        read:      false,
        createdAt: now,
      });

      setSuccess(true);
      setPayMethod(null);
    } catch (err: any) {
      setError("Error enviando el comprobante: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <Crown className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Membresía CubaX
          </h1>
          <p className="text-xs text-gray-400">
            Accede al P2P y Marketplace
          </p>
        </div>
      </div>

      {/* Estado actual */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-24 w-24 bg-brand-500/5 rounded-full blur-2xl" />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Estado actual
          </h2>
          <Badge variant={badge.variant} size="sm">
            {badge.icon}
            <span className="ml-1">{badge.label}</span>
          </Badge>
        </div>

        {membership && !isExpired ? (
          <div className="space-y-3">
            {/* Barra de progreso */}
            <div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>
                  Desde {new Date(membership.startedAt).toLocaleDateString("es-CU")}
                </span>
                <span>
                  Hasta {new Date(expiresAt).toLocaleDateString("es-CU")}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isWarning ? "bg-amber-500" : "bg-brand-500"
                  }`}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        ((expiresAt - now) /
                          (30 * 24 * 60 * 60 * 1000)) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {isWarning && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                  Tu membresía vence en {daysLeft} días. Renuévala para seguir publicando.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                <p className="text-lg font-black text-brand-500">{daysLeft}</p>
                <p className="text-[10px] text-gray-400">días restantes</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
                <p className="text-lg font-black text-gray-900 dark:text-white">
                  {isFreeTrial ? "Gratis" : "Mensual"}
                </p>
                <p className="text-[10px] text-gray-400">plan activo</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <X className="h-7 w-7 text-red-500" />
            </div>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              Sin membresía activa
            </p>
            <p className="text-xs text-gray-400">
              Necesitas una membresía para publicar en P2P y Marketplace.
            </p>
          </div>
        )}
      </Card>

      {/* Beneficios */}
      <Card padding="md">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          ¿Qué incluye la membresía?
        </h3>
        <div className="space-y-2.5">
          {[
            { icon: "📢", text: "Publicar anuncios en el Mercado P2P" },
            { icon: "🛍️", text: "Publicar productos en el Marketplace" },
            { icon: "⚡", text: "Acceso prioritario a nuevas funciones" },
            { icon: "🛡️", text: "Soporte preferencial en disputas" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2.5">
              <span className="text-lg">{item.icon}</span>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Precio */}
      {config && (
        <Card padding="md" className="border-brand-500/20 bg-brand-500/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Precio mensual
            </h3>
            <Badge variant="info" size="sm">Por mes</Badge>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <p className="text-3xl font-black text-brand-500">
                {config.priceCUP} CUP
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                ≈ {config.priceUSDT} USDT
              </p>
            </div>
          </div>
          {!membership && (
            <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                ¡Primer mes completamente GRATIS!
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* Éxito */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 flex-1 font-semibold">
            {payMethod === "wallet"
              ? "¡Membresía activada exitosamente!"
              : "Comprobante enviado. El admin lo revisará pronto."}
          </p>
        </div>
      )}

      {/* Botones de pago */}
      {!success && config && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Método de pago
          </p>

          {/* Pagar con USDT */}
          <button
            onClick={() => setPayMethod(payMethod === "wallet" ? null : "wallet")}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
              payMethod === "wallet"
                ? "border-brand-500 bg-brand-500/5"
                : "border-gray-200 dark:border-white/10 hover:border-brand-500/50"
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Pagar con USDT
              </p>
              <p className="text-[11px] text-gray-400">
                Descuento automático del saldo · {config.priceUSDT} USDT
              </p>
            </div>
            {payMethod === "wallet" && (
              <CheckCircle2 className="h-5 w-5 text-brand-500 flex-shrink-0" />
            )}
          </button>

          {/* Panel de pago con USDT */}
          {payMethod === "wallet" && (
            <Card padding="md" className="animate-slide-up space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tu saldo USDT</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {(user as any).balances?.USDT || 0} USDT
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Costo membresía</span>
                <span className="font-bold text-brand-500">
                  {config.priceUSDT} USDT
                </span>
              </div>
              <div className="h-px bg-gray-100 dark:bg-white/10" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Saldo tras el pago</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {Math.max(
                    0,
                    ((user as any).balances?.USDT || 0) - config.priceUSDT
                  ).toFixed(2)}{" "}
                  USDT
                </span>
              </div>
              <Button
                size="lg"
                fullWidth
                loading={submitting}
                onClick={handlePayWithWallet}
                disabled={
                  ((user as any).balances?.USDT || 0) < config.priceUSDT
                }
              >
                Confirmar pago de {config.priceUSDT} USDT
              </Button>
              {((user as any).balances?.USDT || 0) < config.priceUSDT && (
                <p className="text-[11px] text-red-500 text-center">
                  Saldo insuficiente.{" "}
                  <button
                    onClick={() => navigate("wallet")}
                    className="font-bold underline"
                  >
                    Depositar USDT
                  </button>
                </p>
              )}
            </Card>
          )}

          {/* Transfermóvil */}
          <button
            onClick={() =>
              setPayMethod(payMethod === "transfermovil" ? null : "transfermovil")
            }
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
              payMethod === "transfermovil"
                ? "border-brand-500 bg-brand-500/5"
                : "border-gray-200 dark:border-white/10 hover:border-brand-500/50"
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Transfermóvil
              </p>
              <p className="text-[11px] text-gray-400">
                Pago en CUP · {config.priceCUP} CUP
              </p>
            </div>
            {payMethod === "transfermovil" && (
              <CheckCircle2 className="h-5 w-5 text-brand-500 flex-shrink-0" />
            )}
          </button>

          {/* Enzona */}
          <button
            onClick={() =>
              setPayMethod(payMethod === "enzona" ? null : "enzona")
            }
            className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
              payMethod === "enzona"
                ? "border-brand-500 bg-brand-500/5"
                : "border-gray-200 dark:border-white/10 hover:border-brand-500/50"
            }`}
          >
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💳</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Enzona
              </p>
              <p className="text-[11px] text-gray-400">
                Pago en CUP · {config.priceCUP} CUP
              </p>
            </div>
            {payMethod === "enzona" && (
              <CheckCircle2 className="h-5 w-5 text-brand-500 flex-shrink-0" />
            )}
          </button>

          {/* Panel comprobante móvil */}
          {(payMethod === "transfermovil" || payMethod === "enzona") && (
            <Card padding="md" className="animate-slide-up space-y-4">
              {/* Instrucciones */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  Instrucciones de pago
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                  1. Envía <strong>{config.priceCUP} CUP</strong> al número{" "}
                  <strong>55550000</strong> por{" "}
                  {payMethod === "transfermovil" ? "Transfermóvil" : "Enzona"}.
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                  2. Guarda el número de referencia y captura de pantalla.
                </p>
                <p className="text-[11px] text-gray-600 dark:text-gray-400">
                  3. Súbelos aquí y el admin aprobará en menos de 24 horas.
                </p>
              </div>

              {/* Número de referencia */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Número de referencia
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: 123456789"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                />
              </div>

              {/* Captura de pantalla */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Captura de pantalla del pago
                </label>
                {screenshot ? (
                  <div className="relative">
                    <img
                      src={screenshot}
                      alt="Comprobante"
                      className="w-full h-40 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                    />
                    <button
                      onClick={() => setScreenshot(null)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-brand-500 transition-colors">
                    {uploadingImg ? (
                      <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-400">
                          Toca para subir la captura
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshot}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <Button
                size="lg"
                fullWidth
                loading={submitting}
                onClick={handlePayWithMobile}
                disabled={!reference.trim() || !screenshot}
              >
                Enviar comprobante
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[11px] font-bold text-gray-900 dark:text-white mb-0.5">
            Sin membresía puedes igualmente
          </p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Ver anuncios P2P y productos del Marketplace, realizar trades
            iniciados por otros usuarios, usar tu wallet y hacer KYC.
          </p>
        </div>
      </div>
    </div>
  );
} 
