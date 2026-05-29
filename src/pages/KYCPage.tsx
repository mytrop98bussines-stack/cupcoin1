import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
} from "lucide-react";

export function KYCPage() {
  const { user, setUser } = useAppStore();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [address, setAddress] = useState("");
  const [idFront, setIdFront] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileSelect = useCallback(
    (type: "id" | "selfie") => {
      const mockUrl = `https://placehold.co/400x300/1a2ab4/e6ab34?text=${type === "id" ? "ID+Document" : "Selfie"}`;
      if (type === "id") setIdFront(mockUrl);
      else setSelfie(mockUrl);
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!fullName || !idNumber || !address || !idFront || !selfie || !user) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 2000));

    setUser({ ...user, kycStatus: "pending_verification" });
    setLoading(false);
    setSubmitted(true);
  }, [fullName, idNumber, address, idFront, selfie, user, setUser]);

  if (!user) return null;

  if (user.kycStatus === "verified") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Cuenta verificada
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tu identidad ha sido verificada exitosamente. Puedes operar sin
          restricciones.
        </p>
        <Badge variant="success" size="md" className="mt-4">
          ✓ KYC Aprobado
        </Badge>
      </div>
    );
  }

  if (submitted || user.kycStatus === "pending_verification") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <Clock className="h-8 w-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          En revisión
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
          Tus documentos están siendo revisados. Te notificaremos cuando se
          complete la verificación. Tiempo estimado: 24-48 horas.
        </p>
        <Badge variant="info" size="md" className="mt-4">
          <Clock className="h-3 w-3 mr-1" /> Pendiente
        </Badge>
      </div>
    );
  }

  const steps = [
    { label: "Datos personales", icon: <User className="h-4 w-4" /> },
    { label: "Documento de identidad", icon: <FileText className="h-4 w-4" /> },
    { label: "Selfie de verificación", icon: <Camera className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Verificación KYC
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Verifica tu identidad para operar sin límites
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.label} className="flex-1">
            <div
              className={`h-1 rounded-full transition-colors ${
                i <= step ? "bg-brand-500" : "bg-gray-200 dark:bg-white/10"
              }`}
            />
            <div className="flex items-center gap-1 mt-1.5">
              <span
                className={`${
                  i <= step
                    ? "text-brand-500"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {s.icon}
              </span>
              <span
                className={`text-[10px] font-medium ${
                  i <= step
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {s.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Security Notice */}
      <Card padding="sm" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Tus documentos se suben de forma segura con firma criptográfica
            (Cloudinary Signed Upload). Las credenciales nunca se exponen al
            cliente.
          </p>
        </div>
      </Card>

      {/* Step 0: Personal Info */}
      {step === 0 && (
        <div className="space-y-4 animate-slide-up">
          <Input
            label="Nombre completo (como en tu ID)"
            placeholder="Juan Carlos García López"
            icon={<User className="h-4 w-4" />}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Número de identificación (CI)"
            placeholder="XXXXXXXXXXX"
            icon={<FileText className="h-4 w-4" />}
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
          />
          <Input
            label="Dirección"
            placeholder="Calle, Municipio, Provincia"
            icon={<MapPin className="h-4 w-4" />}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <Button
            size="lg"
            fullWidth
            onClick={() => setStep(1)}
            disabled={!fullName || !idNumber || !address}
          >
            Continuar
          </Button>
        </div>
      )}

      {/* Step 1: ID Upload */}
      {step === 1 && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sube una foto clara del frente de tu documento de identidad (CI).
          </p>
          <button
            onClick={() => handleFileSelect("id")}
            className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center hover:border-brand-500 transition-colors"
          >
            {idFront ? (
              <div className="space-y-2">
                <img
                  src={idFront}
                  alt="ID Front"
                  className="w-40 h-28 object-cover rounded-lg mx-auto"
                />
                <p className="text-xs text-emerald-500 font-medium">
                  ✓ Documento cargado
                </p>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toca para subir tu ID
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  JPG o PNG, máximo 5MB
                </p>
              </>
            )}
          </button>
          <div className="flex gap-2">
            <Button size="lg" variant="outline" onClick={() => setStep(0)} className="flex-1">
              Atrás
            </Button>
            <Button
              size="lg"
              onClick={() => setStep(2)}
              disabled={!idFront}
              className="flex-1"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Selfie */}
      {step === 2 && (
        <div className="space-y-4 animate-slide-up">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tómate una selfie sosteniendo tu documento de identidad junto a tu
            rostro.
          </p>
          <button
            onClick={() => handleFileSelect("selfie")}
            className="w-full border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center hover:border-brand-500 transition-colors"
          >
            {selfie ? (
              <div className="space-y-2">
                <img
                  src={selfie}
                  alt="Selfie"
                  className="w-32 h-32 object-cover rounded-full mx-auto"
                />
                <p className="text-xs text-emerald-500 font-medium">
                  ✓ Selfie cargada
                </p>
              </div>
            ) : (
              <>
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Toca para tomar selfie
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Asegúrate de buena iluminación
                </p>
              </>
            )}
          </button>

          {/* Review Summary */}
          {selfie && (
            <Card padding="md" className="bg-gray-50 dark:bg-white/[0.03]">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Resumen de verificación
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Nombre</span>
                  <span className="font-medium text-gray-900 dark:text-white">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">CI</span>
                  <span className="font-medium text-gray-900 dark:text-white">{idNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Documentos</span>
                  <span className="font-medium text-emerald-500">✓ 2 archivos</span>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-2">
            <Button size="lg" variant="outline" onClick={() => setStep(1)} className="flex-1">
              Atrás
            </Button>
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={!selfie}
              loading={loading}
              className="flex-1"
              icon={<Shield className="h-4 w-4" />}
            >
              Enviar verificación
            </Button>
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="space-y-2 pt-2">
        <Card padding="sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong className="text-gray-700 dark:text-gray-300">Sin verificar:</strong>{" "}
              Límite de 50 USDT por operación. Verifica tu identidad para
              eliminar restricciones.
            </p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong className="text-gray-700 dark:text-gray-300">Tiempo:</strong>{" "}
              La revisión toma entre 24 y 48 horas. Recibirás una notificación.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
