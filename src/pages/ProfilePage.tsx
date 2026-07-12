import { useState, useRef, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import { Badge }  from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  User, Camera, Edit3, Check, X, Star,
  Shield, ArrowLeftRight, Calendar, MapPin,
  Phone, Globe, Copy, CheckCircle2, TrendingUp,
  Package, Clock, AlertTriangle, Loader2,
} from "lucide-react";

const CLOUDINARY_CLOUD_NAME    = "dc4caibrn";
const CLOUDINARY_UPLOAD_PRESET = "cubax_unsigned";
const BACKEND_URL              = "https://cubax-backend.onrender.com/api";

export function ProfilePage() {
  const { user, setUser, navigate } = useAppStore();

  const [editingName, setEditingName]         = useState(false);
  const [editingBio, setEditingBio]           = useState(false);
  const [editingPhone, setEditingPhone]       = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  const [newName, setNewName]         = useState(user?.displayName || "");
  const [newBio, setNewBio]           = useState((user as any)?.bio || "");
  const [newPhone, setNewPhone]       = useState((user as any)?.phone || "");
  const [newLocation, setNewLocation] = useState((user as any)?.location || "");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [savingName, setSavingName]         = useState(false);
  const [savingBio, setSavingBio]           = useState(false);
  const [savingPhone, setSavingPhone]       = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const kycConfig = {
    unverified: {
      label:   "Sin verificar",
      variant: "warning" as const,
      color:   "text-amber-500",
    },
    pending_verification: {
      label:   "En revisión",
      variant: "info" as const,
      color:   "text-blue-500",
    },
    verified: {
      label:   "Verificado ✓",
      variant: "success" as const,
      color:   "text-emerald-500",
    },
    rejected: {
      label:   "Rechazado",
      variant: "danger" as const,
      color:   "text-red-500",
    },
  };

  const currentKyc =
    kycConfig[user.kycStatus as keyof typeof kycConfig] ||
    kycConfig.unverified;

  const handleCopyUID = () => {
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Subir foto via backend ───────────────────────────────
  const handlePhotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setError("La foto no puede superar los 5MB.");
        return;
      }

      setUploadingPhoto(true);
      setError(null);

      try {
        // 1. Subir a Cloudinary
        const formData = new FormData();
        formData.append("file",          file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder",        `cubax/avatars/${user.uid}`);

        const cloudRes  = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        if (!cloudRes.ok) throw new Error("Error subiendo foto.");
        const cloudData = await cloudRes.json();
        const photoURL  = cloudData.secure_url;

        // 2. Actualizar via backend
        const token = localStorage.getItem("cubax_token");
        await fetch(`${BACKEND_URL}/profile/update`, {
          method:  "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ photoURL }),
        });

        // 3. Actualizar store
        setUser({ ...user, photoURL });

      } catch (err: any) {
        setError("Error al subir la foto: " + err.message);
      } finally {
        setUploadingPhoto(false);
        e.target.value = "";
      }
    },
    [user, setUser]
  );

  // ─── Guardar nombre via backend ───────────────────────────
  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    setSavingName(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/profile/update`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: newName.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setUser({ ...user, displayName: newName.trim() });
      setEditingName(false);
      setError(null);
    } catch (err: any) {
      setError("Error al guardar nombre: " + err.message);
    } finally {
      setSavingName(false);
    }
  };

  // ─── Guardar bio via backend ──────────────────────────────
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/profile/update`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ bio: newBio.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setUser({ ...user, bio: newBio.trim() } as any);
      setEditingBio(false);
      setError(null);
    } catch (err: any) {
      setError("Error al guardar bio: " + err.message);
    } finally {
      setSavingBio(false);
    }
  };

  // ─── Guardar teléfono via backend ─────────────────────────
  const handleSavePhone = async () => {
    setSavingPhone(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/profile/update`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: newPhone.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setUser({ ...user, phone: newPhone.trim() } as any);
      setEditingPhone(false);
      setError(null);
    } catch (err: any) {
      setError("Error al guardar teléfono: " + err.message);
    } finally {
      setSavingPhone(false);
    }
  };

  // ─── Guardar ubicación via backend ────────────────────────
  const handleSaveLocation = async () => {
    setSavingLocation(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/profile/update`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ location: newLocation.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setUser({ ...user, location: newLocation.trim() } as any);
      setEditingLocation(false);
      setError(null);
    } catch (err: any) {
      setError("Error al guardar ubicación: " + err.message);
    } finally {
      setSavingLocation(false);
    }
  };

  const stats = [
    {
      icon:  <ArrowLeftRight className="h-4 w-4" />,
      label: "Trades",
      value: String(user.totalTrades || 0),
      color: "text-brand-500",
      bg:    "bg-brand-500/10",
    },
    {
      icon:  <Star className="h-4 w-4" />,
      label: "Rating",
      value: `${(user as any).rating || "5.0"}⭐`,
      color: "text-amber-500",
      bg:    "bg-amber-500/10",
    },
    {
      icon:  <Package className="h-4 w-4" />,
      label: "Productos",
      value: String((user as any).totalProducts || 0),
      color: "text-violet-500",
      bg:    "bg-violet-500/10",
    },
    {
      icon:  <TrendingUp className="h-4 w-4" />,
      label: "Vol. total",
      value: `$${((user as any).totalVolume || 0).toLocaleString("en-US")}`,
      color: "text-emerald-500",
      bg:    "bg-emerald-500/10",
    },
  ];

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-CU", {
        month: "long",
        year:  "numeric",
      })
    : "—";
  
  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Input oculto para foto */}
      <input
        type="file"
        accept="image/*"
        ref={photoInputRef}
        onChange={handlePhotoChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Mi Perfil
        </h1>
        <Badge variant={currentKyc.variant} size="sm">
          {currentKyc.label}
        </Badge>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">
            {error}
          </p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {/* ═══ FOTO + NOMBRE ═══════════════════════════════════ */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center relative z-10">
          {/* Foto de perfil */}
          <div className="relative mb-4">
            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                  <span className="text-white font-black text-3xl">
                    {user.displayName?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}
            </div>

            {/* Botón cambiar foto */}
            <button
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {/* Nombre editable */}
          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 text-center font-bold text-lg bg-gray-50 dark:bg-white/5 border border-brand-500/30 rounded-xl px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
                autoFocus
                maxLength={40}
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center"
              >
                {savingName ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setNewName(user.displayName || "");
                }}
                className="h-8 w-8 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user.displayName}
              </h2>
              <button
                onClick={() => setEditingName(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          )}

          {/* Email */}
          <p className="text-xs text-gray-400 mt-1">{user.email}</p>

          {/* Miembro desde */}
          <div className="flex items-center gap-1 mt-2 text-[11px] text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>Miembro desde {memberSince}</span>
          </div>

          {/* UID copiable */}
          <button
            onClick={handleCopyUID}
            className={`flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-[10px] font-semibold transition-all ${
              copied
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            }`}
          >
            {copied ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "UID copiado" : `ID: ${user.uid.slice(0, 12)}...`}
          </button>
        </div>
      </Card>

      {/* ═══ ESTADÍSTICAS ════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="text-center p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06]"
          >
            <div
              className={`h-8 w-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mx-auto mb-1.5`}
            >
              {stat.icon}
            </div>
            <p className="text-xs font-black text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="text-[9px] text-gray-400 font-medium mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ═══ INFORMACIÓN PERSONAL ════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Información personal
        </h3>
        <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05]">

          {/* Bio */}
          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-brand-500" />
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sobre mí
                </span>
              </div>
              {!editingBio && (
                <button
                  onClick={() => setEditingBio(true)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <Edit3 className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {editingBio ? (
              <div className="space-y-2">
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Cuéntanos algo sobre ti..."
                  maxLength={160}
                  rows={3}
                  className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-brand-500/30 rounded-xl px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">
                    {newBio.length}/160
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingBio(false);
                        setNewBio((user as any).bio || "");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-semibold text-gray-600 dark:text-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveBio}
                      disabled={savingBio}
                      className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      {savingBio ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {(user as any).bio || (
                  <span className="text-gray-300 dark:text-gray-600 italic">
                    Sin bio. Toca editar para agregar una.
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Teléfono
                  </p>
                  {editingPhone ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) =>
                          setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 12))
                        }
                        placeholder="+53 5XXXXXXX"
                        className="text-sm bg-gray-50 dark:bg-white/5 border border-brand-500/30 rounded-lg px-2 py-1 text-gray-900 dark:text-white focus:outline-none w-36"
                        autoFocus
                      />
                      <button
                        onClick={handleSavePhone}
                        disabled={savingPhone}
                        className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center"
                      >
                        {savingPhone ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPhone(false);
                          setNewPhone((user as any).phone || "");
                        }}
                        className="h-7 w-7 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-500 flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                      {(user as any).phone || (
                        <span className="text-gray-400 italic text-xs">
                          No agregado
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              {!editingPhone && (
                <button
                  onClick={() => setEditingPhone(true)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <Edit3 className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ubicación
                  </p>
                  {editingLocation ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="La Habana, Cuba"
                        className="text-sm bg-gray-50 dark:bg-white/5 border border-brand-500/30 rounded-lg px-2 py-1 text-gray-900 dark:text-white focus:outline-none w-40"
                        autoFocus
                        maxLength={50}
                      />
                      <button
                        onClick={handleSaveLocation}
                        disabled={savingLocation}
                        className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center"
                      >
                        {savingLocation ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditingLocation(false);
                          setNewLocation((user as any).location || "");
                        }}
                        className="h-7 w-7 rounded-lg bg-gray-200 dark:bg-white/10 text-gray-500 flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                      {(user as any).location || (
                        <span className="text-gray-400 italic text-xs">
                          No agregada
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              {!editingLocation && (
                <button
                  onClick={() => setEditingLocation(true)}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <Edit3 className="h-3.5 w-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Email (no editable) */}
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Correo electrónico
                </p>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Miembro desde (no editable) */}
          <div className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-violet-500" />
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Miembro desde
                </p>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5">
                  {memberSince}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ REPUTACIÓN ══════════════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Reputación
        </h3>
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              <span className="text-2xl font-black text-gray-900 dark:text-white">
                {(user as any).rating || "5.0"}
              </span>
              <span className="text-sm text-gray-400">/ 5.0</span>
            </div>
            <Badge variant="success" size="sm">
              {user.totalTrades || 0} trades
            </Badge>
          </div>

          {/* Barra de reputación */}
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-3">{stars}</span>
                <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{
                      width: stars === 5 ? "85%" : stars === 4 ? "10%" : "5%",
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-6 text-right">
                  {stars === 5 ? "85%" : stars === 4 ? "10%" : "5%"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ═══ VERIFICACIÓN ════════════════════════════════════ */}
      {user.kycStatus !== "verified" && (
        <Card
          padding="md"
          className="border-amber-500/20 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors"
          onClick={() => navigate("kyc")}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Verificar identidad
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Completa el KYC para operar sin límites
              </p>
            </div>
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
          </div>
        </Card>
      )}

      {/* ═══ ACCIONES RÁPIDAS ════════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label:  "Mis trades",
              icon:   <ArrowLeftRight className="h-4 w-4" />,
              color:  "bg-brand-500/10 text-brand-500",
              action: () => navigate("p2p"),
            },
            {
              label:  "Mi Wallet",
              icon:   <TrendingUp className="h-4 w-4" />,
              color:  "bg-emerald-500/10 text-emerald-500",
              action: () => navigate("wallet"),
            },
            {
              label:  "Marketplace",
              icon:   <Package className="h-4 w-4" />,
              color:  "bg-violet-500/10 text-violet-500",
              action: () => navigate("marketplace"),
            },
            {
              label:  "Verificación",
              icon:   <Shield className="h-4 w-4" />,
              color:  "bg-amber-500/10 text-amber-500",
              action: () => navigate("kyc"),
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="flex items-center gap-2.5 p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.06] hover:border-gray-200 dark:hover:border-white/10 transition-all text-left active:scale-[0.98]"
            >
              <div
                className={`h-8 w-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}
              >
                {item.icon}
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
