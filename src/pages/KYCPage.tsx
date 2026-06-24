import { useState, useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { db } from "@/lib/firebase/config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  Shield,
  Upload,
  Camera,
  User,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  MapPin,
  RefreshCw,
  Lock,
  ChevronRight,
  X,
} from "lucide-react";

// ─── Cloudinary config ────────────────────────────────────
const CLOUDINARY_CLOUD_NAME    = "dc4caibrn";
const CLOUDINARY_UPLOAD_PRESET = "cubax_unsigned";

export function KYCPage() {
  const { user, setUser, navigate } = useAppStore();

  const [step, setStep]           = useState(0);
  const [fullName, setFullName]   = useState(user?.displayName || "");
  const [idNumber, setIdNumber]   = useState("");
  const [address, setAddress]     = useState("");
  const [idFront, setIdFront]     = useState<string | null>(null);
  const [selfie, setSelfie]       = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [uploadingType, setUploadingType] = useState<"id" | "selfie" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const idInputRef     = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  // ─── Validación del paso 0 ────────────────────────────────
  const validateStep0 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 3) {
      newErrors.fullName = "Ingresa tu nombre completo.";
    }
    if (!idNumber.trim() || idNumber.trim().length < 11) {
      newErrors.idNumber = "El carné de identidad debe tener 11 dígitos.";
    }
    if (!/^\d+$/.test(idNumber.trim())) {
      newErrors.idNumber = "Solo se permiten números.";
    }
    if (!address.trim() || address.trim().length < 5) {
      newErrors.address = "Ingresa una dirección válida.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Subida a Cloudinary ──────────────────────────────────
  const handleFileChange = useCallback(
    async (
      e: React.ChangeEvent<HTMLInputElement>,
      type: "id" | "selfie"
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // ✅ Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("La imagen no puede superar los 5MB.");
        return;
      }

      // ✅ Validar tipo
      if (!file.type.startsWith("image/")) {
        setUploadError("Solo se permiten archivos de imagen.");
        return;
      }

      setUploadingType(type);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append(
        "folder",
        `cubax/kyc/${user?.uid}/${type}`
      );

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error?.message || `Error ${response.status}`
          );
        }

        const data = await response.json();
        if (type === "id") {
          setIdFront(data.secure_url);
        } else {
          setSelfie(data.secure_url);
        }
      } catch (error: any) {
        console.error("Error subiendo a Cloudinary:", error);
        setUploadError(
          `Error al subir ${type === "id" ? "el documento" : "la selfie"}: ${error.message}`
        );
      } finally {
        setUploadingType(null);
        // Limpiar input para permitir subir la misma imagen
        e.target.value = "";
      }
    },
    [user?.uid]
  );

  // ─── Enviar KYC a Firestore ───────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (
      !fullName || !idNumber || !address ||
      !idFront  || !selfie  || !user?.uid
    ) return;

    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        kycStatus:    "pending_verification",
        kycDocuments: { idFront, selfie },
        kycData: {
          fullName: fullName.trim(),
          idNumber: idNumber.trim(),
          address:  address.trim(),
        },
        kycSubmittedAt: serverTimestamp(),
      });

      setUser({
        ...user,
        kycStatus:    "pending_verification",
        kycDocuments: { idFront, selfie },
      });

      setSubmitted(true);
    } catch (error: any) {
      console.error("Error enviando KYC:", error);
      setUploadError("Error al enviar la solicitud: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [fullName, idNumber, address, idFront, selfie, user, setUser]);

  if (!user) return null;

  // ─── PANTALLA: KYC APROBADO ───────────────────────────────
  if (user.kycStatus === "verified") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Identidad verificada
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
          Tu cuenta está completamente verificada. Puedes operar sin
          restricciones en CubaX.
        </p>
        <Badge variant="success" size="md">
          ✓ KYC Aprobado
        </Badge>
        <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Sin límites
            </p>
            <p className="text-[10px] text-gray-400">en P2P</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Acceso total
            </p>
            <p className="text-[10px] text-gray-400">al Marketplace</p>
          </div>
        </div>
        <Button
          size="lg"
          className="mt-6 w-full max-w-xs mx-auto"
          onClick={() => navigate("dashboard")}
        >
          Ir al Dashboard
        </Button>
      </div>
    );
  }

  // ─── PANTALLA: EN REVISIÓN ────────────────────────────────
  if (submitted || user.kycStatus === "pending_verification") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="relative h-20 w-20 mx-auto mb-4">
          <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Clock className="h-10 w-10 text-blue-500" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center border-2 border-white dark:border-navy-950">
            <RefreshCw className="h-3.5 w-3.5 text-white animate-spin" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          En revisión
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
          Tus documentos están siendo revisados por nuestro equipo. Te
          notificaremos cuando se complete.
        </p>
        <Badge variant="info" size="md" className="mb-6">
          <Clock className="h-3 w-3 mr-1" /> Pendiente de revisión
        </Badge>

        {/* Pasos de revisión */}
        <div className="text-left space-y-2 max-w-xs mx-auto mb-6">
          {[
            { label: "Documentos recibidos",    done: true  },
            { label: "Verificación en proceso", done: false },
            { label: "Aprobación final",         done: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.done
                    ? "bg-emerald-500"
                    : "bg-gray-200 dark:bg-white/10"
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-gray-400" />
                )}
              </div>
              <p
                className={`text-xs font-medium ${
                  item.done
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400"
                }`}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-400">
          Tiempo estimado: <strong>24-48 horas</strong>
        </p>
      </div>
    );
  }

  // ─── PANTALLA: KYC RECHAZADO ──────────────────────────────
  if (user.kycStatus === "rejected") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <X className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Verificación rechazada
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-4">
          Tu solicitud fue rechazada. Por favor, vuelve a intentarlo con
          documentos más claros y legibles.
        </p>
        <Button
          size="lg"
          className="w-full max-w-xs mx-auto"
          onClick={() => {
            setStep(0);
            setIdFront(null);
            setSelfie(null);
            setErrors({});
          }}
        >
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  // ─── PASOS ────────────────────────────────────────────────
  const steps = [
    { label: "Datos personales",       icon: <User     className="h-4 w-4" /> },
    { label: "Documento de identidad", icon: <FileText className="h-4 w-4" /> },
    { label: "Selfie",                 icon: <Camera   className="h-4 w-4" /> },
  ];

  // ─── RENDER PRINCIPAL ─────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Inputs ocultos */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={idInputRef}
        onChange={(e) => handleFileChange(e, "id")}
        className="hidden"
      />
      <input
        type="file"
        accept="image/*"
        capture="user"
        ref={selfieInputRef}
        onChange={(e) => handleFileChange(e, "selfie")}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Verificación KYC
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Paso {step + 1} de {steps.length}
          </p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s.label}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                i <= step
                  ? "bg-brand-500"
                  : "bg-gray-200 dark:bg-white/10"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-brand-500">
            {steps[step].icon}
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {steps[step].label}
          </span>
        </div>
      </div>

      {/* Error de subida */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">
            {uploadError}
          </p>
          <button onClick={() => setUploadError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* Info de seguridad */}
      <Card
        padding="sm"
        className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5"
      >
        <div className="flex items-start gap-2">
          <Lock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Tus documentos se almacenan de forma cifrada. Solo nuestro equipo
            de verificación tiene acceso.
          </p>
        </div>
      </Card>

      {/* ═══ PASO 0: DATOS PERSONALES ════════════════════════ */}
      {step === 0 && (
        <div className="space-y-4 animate-slide-up">
          <Input
            label="Nombre completo (como en tu CI)"
            placeholder="Juan Carlos García López"
            icon={<User className="h-4 w-4" />}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((p) => ({ ...p, fullName: "" }));
            }}
            error={errors.fullName}
          />
          <Input
            label="Número de carné de identidad (11 dígitos)"
            placeholder="98061234567"
            icon={<FileText className="h-4 w-4" />}
            value={idNumber}
            onChange={(e) => {
              // Solo números
              const val = e.target.value.replace(/\D/g, "").slice(0, 11);
              setIdNumber(val);
              if (errors.idNumber) setErrors((p) => ({ ...p, idNumber: "" }));
            }}
            error={errors.idNumber}
            type="tel"
            inputMode="numeric"
          />
          <Input
            label="Dirección"
            placeholder="Calle 23 #456, Vedado, La Habana"
            icon={<MapPin className="h-4 w-4" />}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              if (errors.address) setErrors((p) => ({ ...p, address: "" }));
            }}
            error={errors.address}
          />
          <Button
            size="lg"
            fullWidth
            onClick={() => {
              if (validateStep0()) setStep(1);
            }}
            icon={<ChevronRight className="h-4 w-4" />}
          >
            Continuar
          </Button>
        </div>
      )}

      {/* ═══ PASO 1: DOCUMENTO DE IDENTIDAD ══════════════════ */}
      {step === 1 && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Sube una foto clara y legible del{" "}
            <strong>frente de tu carné de identidad</strong>. Asegúrate de
            que todos los datos sean visibles.
          </p>

          <button
            onClick={() => idInputRef.current?.click()}
            disabled={uploadingType !== null}
            className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all outline-none ${
              idFront
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-gray-200 dark:border-white/10 hover:border-brand-500 bg-white dark:bg-white/5"
            } disabled:opacity-50`}
          >
            {uploadingType === "id" ? (
              <div className="space-y-2 py-4">
                <div className="h-7 w-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400 animate-pulse">
                  Subiendo documento...
                </p>
              </div>
            ) : idFront ? (
              <div className="space-y-3">
                <img
                  src={idFront}
                  alt="Documento"
                  className="w-48 h-32 object-cover rounded-xl mx-auto shadow-md"
                />
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Documento subido correctamente
                  </p>
                </div>
                <p className="text-[10px] text-gray-400">
                  Toca para cambiar la imagen
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-14 w-14 rounded-xl bg-brand-500/10 flex items-center justify-center mx-auto">
                  <Upload className="h-7 w-7 text-brand-500" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Toca para abrir cámara o galería
                </p>
                <p className="text-[10px] text-gray-400">
                  JPG o PNG • Máx. 5MB
                </p>
              </div>
            )}
          </button>

          {/* Tips */}
          <div className="space-y-1.5">
            {[
              "Imagen nítida y bien iluminada",
              "Todos los datos legibles",
              "Sin reflejos ni sombras",
            ].map((tip) => (
              <div key={tip} className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-500 flex-shrink-0" />
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {tip}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setStep(0)}
              disabled={uploadingType !== null}
              className="flex-1"
            >
              Atrás
            </Button>
            <Button
              size="lg"
              onClick={() => setStep(2)}
              disabled={!idFront || uploadingType !== null}
              className="flex-1"
              icon={<ChevronRight className="h-4 w-4" />}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* ═══ PASO 2: SELFIE ══════════════════════════════════ */}
      {step === 2 && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Tómate una <strong>selfie sosteniendo tu CI</strong> junto a tu
            rostro. Ambos deben ser claramente visibles.
          </p>

          <button
            onClick={() => selfieInputRef.current?.click()}
            disabled={uploadingType !== null}
            className={`w-full border-2 border-dashed rounded-2xl p-8 text-center transition-all outline-none ${
              selfie
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-gray-200 dark:border-white/10 hover:border-brand-500 bg-white dark:bg-white/5"
            } disabled:opacity-50`}
          >
            {uploadingType === "selfie" ? (
              <div className="space-y-2 py-4">
                <div className="h-7 w-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400 animate-pulse">
                  Subiendo selfie...
                </p>
              </div>
            ) : selfie ? (
              <div className="space-y-3">
                <img
                  src={selfie}
                  alt="Selfie"
                  className="w-32 h-32 object-cover rounded-full mx-auto shadow-md border-4 border-emerald-500/20"
                />
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Selfie subida correctamente
                  </p>
                </div>
                <p className="text-[10px] text-gray-400">
                  Toca para cambiar la selfie
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="h-14 w-14 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto">
                  <Camera className="h-7 w-7 text-brand-500" />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Toca para capturar selfie
                </p>
                <p className="text-[10px] text-gray-400">
                  Buena iluminación • Rostro y CI visibles
                </p>
              </div>
            )}
          </button>

          {/* Resumen antes de enviar */}
          {selfie && (
            <Card padding="md" className="bg-gray-50 dark:bg-white/[0.03]">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Resumen de tu solicitud
              </p>
              <div className="space-y-2">
                {[
                  { label: "Nombre",    value: fullName },
                  { label: "CI",        value: idNumber },
                  { label: "Dirección", value: address  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[60%] text-right">
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 border-t border-gray-200 dark:border-white/10">
                  <span className="text-xs text-gray-400">Documentos</span>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      2 de 2 subidos
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setStep(1)}
              disabled={uploadingType !== null || loading}
              className="flex-1"
            >
              Atrás
            </Button>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!selfie || uploadingType !== null}
              loading={loading}
              className="flex-1"
              icon={<Shield className="h-4 w-4" />}
            >
              Enviar KYC
            </Button>
          </div>
        </div>
      )}

      {/* Info de límites */}
      <Card padding="sm">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-0.5">
              ¿Por qué verificar tu cuenta?
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Sin verificación tienes límites de volumen en P2P y el
              Marketplace. Verifica para operar sin restricciones.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}