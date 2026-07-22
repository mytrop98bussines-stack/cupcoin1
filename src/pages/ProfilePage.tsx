import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import {
  User, Mail, Calendar, Shield, Star,
  Camera, Save, Loader2, CheckCircle2,
  AlertTriangle, X, Award, Edit3,
} from "lucide-react";

const BACKEND_URL              = "https://cubax-backend.onrender.com/api";
const CLOUDINARY_CLOUD_NAME    = "dc4caibrn";
const CLOUDINARY_UPLOAD_PRESET = "cubax_unsigned";

export function ProfilePage() {
  const { user, setUser, navigate } = useAppStore();

  const [displayName, setDisplayName]     = useState(user?.displayName || "");
  const [photoURL, setPhotoURL]           = useState(user?.photoURL || "");
  const [uploading, setUploading]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState<string | null>(null);
  const [hasChanges, setHasChanges]       = useState(false);
  const fileInputRef                      = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || "");
    setPhotoURL(user.photoURL || "");
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const changed =
      displayName !== (user.displayName || "") ||
      photoURL    !== (user.photoURL    || "");
    setHasChanges(changed);
  }, [displayName, photoURL, user]);

  if (!user) return null;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-CU", {
        month: "long",
        year:  "numeric",
      })
    : "—";

  const kycConfig = {
    verified:             { label: "Verificado ✓",  variant: "success" as const },
    pending_verification: { label: "En revisión",   variant: "info"    as const },
    unverified:           { label: "Sin verificar", variant: "warning" as const },
    rejected:             { label: "Rechazado",     variant: "danger"  as const },
  };

  const kyc = kycConfig[user.kycStatus as keyof typeof kycConfig]
    || kycConfig.unverified;

  const rating = (user as any).rating || 5;
  const stars  = Math.round(rating);

  // ─── Subir foto a Cloudinary ──────────────────────────────
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen es demasiado grande (máx 5MB)");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file",          file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder",        `cubax/avatars/${user.uid}`);

      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();

      if (!data.secure_url) throw new Error("Error subiendo imagen");

      setPhotoURL(data.secure_url);
    } catch (err: any) {
      setError("Error subiendo foto: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ─── Guardar cambios ─────────────────────────────────────
  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("El nombre no puede estar vacío");
      return;
    }

    if (displayName.trim().length < 2) {
      setError("El nombre es demasiado corto");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/profile/update`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          photoURL,
        }),
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.error);

      setUser({
        ...user,
        displayName: displayName.trim(),
        photoURL,
      } as any);

      setSuccess("✅ Perfil actualizado correctamente");
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Error guardando cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <User className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          <p className="text-xs text-gray-400">Edita tu información personal</p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{success}</p>
        </div>
      )}

      {/* Foto de perfil */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-24 w-24 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar
              name={displayName || user.displayName}
              src={photoURL}
              size="lg"
            />

            {(user as any).verifiedTrader && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-white dark:border-gray-900">
                <VerifiedBadge verified={true} size="md" />
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-lg flex items-center justify-center transition-all disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleUploadPhoto}
            className="hidden"
          />

          <div className="text-center">
            <p className="text-xs text-gray-400">
              {uploading ? "Subiendo foto..." : "Toca la cámara para cambiar tu foto"}
            </p>
          </div>

          {(user as any).verifiedTrader && (
            <div className="flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-bold text-blue-500">
                Trader Verificado
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Datos editables */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Información personal
        </h3>
        <Card padding="md" className="space-y-4">
          <Input
            label="Nombre completo"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            icon={<User className="h-4 w-4" />}
            placeholder="Tu nombre completo"
          />

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Correo electrónico
            </label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                {user.email}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold">
                No editable
              </span>
            </div>
          </div>

          {hasChanges && (
            <Button
              size="lg"
              fullWidth
              loading={saving}
              onClick={handleSave}
              icon={<Save className="h-4 w-4" />}
            >
              Guardar cambios
            </Button>
          )}
        </Card>
      </div>

      {/* Estadísticas */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Estadísticas
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Card padding="md" className="text-center">
            <p className="text-xl font-black text-brand-500">
              {user.totalTrades || 0}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Trades</p>
          </Card>

          <Card padding="md" className="text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-xl font-black text-amber-500">
                {rating.toFixed(1)}
              </p>
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Rating</p>
          </Card>

          <Card padding="md" className="text-center">
            <p className="text-xl font-black text-emerald-500">
              {(user as any).totalReviews || 0}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Reseñas</p>
          </Card>
        </div>
      </div>

      {/* Info de cuenta */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Información de cuenta
        </h3>
        <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Miembro desde</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {memberSince}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Estado KYC</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant={kyc.variant} size="sm">
                  {kyc.label}
                </Badge>
              </div>
            </div>
            {user.kycStatus !== "verified" && (
              <button
                onClick={() => navigate("kyc")}
                className="text-xs font-bold text-brand-500"
              >
                Verificar →
              </button>
            )}
          </div>

          {user.role === "admin" && (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Rol</p>
                <Badge variant="danger" size="sm">Admin</Badge>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Ver perfil público */}
      <Card padding="md" className="bg-brand-500/5 border-brand-500/20">
        <div className="flex items-start gap-2">
          <Edit3 className="h-4 w-4 text-brand-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-brand-700 dark:text-brand-400 mb-1">
              Perfil público
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Los otros usuarios ven tu nombre, foto, rating y trades completados
              cuando publicas ofertas en el P2P.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
      }
