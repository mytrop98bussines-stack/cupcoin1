import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import {
  Megaphone, Plus, Loader2, Trash2, X,
  CheckCircle2, XCircle, Image as ImageIcon,
  ArrowLeft, Upload,
} from "lucide-react";

const BACKEND_URL              = "https://cubax-backend.onrender.com/api";
const CLOUDINARY_CLOUD_NAME    = "dc4caibrn";
const CLOUDINARY_UPLOAD_PRESET = "cubax_unsigned";

export function AdminPromosPage() {
  const { user, navigate } = useAppStore();

  const [promos, setPromos]     = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title:       "",
    description: "",
    emoji:       "🎉",
    imageUrl:    "",
    buttonText:  "",
    buttonLink:  "",
    order:       0,
    active:      true,
  });

  useEffect(() => {
    void loadPromos();
  }, []);

  const loadPromos = async () => {
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/admin/promos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPromos(data.promos);
    } catch (err) {
      console.error("❌ Error cargando promos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file",          file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder",        "cubax/promos");

      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) setForm({ ...form, imageUrl: data.secure_url });
    } catch (err) {
      alert("Error subiendo imagen");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.description) {
      alert("Título y descripción son obligatorios");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/admin/promos`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setShowModal(false);
        setForm({
          title: "", description: "", emoji: "🎉",
          imageUrl: "", buttonText: "", buttonLink: "",
          order: 0, active: true,
        });
        await loadPromos();
      }
    } catch (err) {
      alert("Error creando promo");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/admin/promos/${id}/toggle`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) await loadPromos();
    } catch {}
  };

  const handleDelete = async (id: string) => {
  if (!confirm("¿Eliminar esta promo?")) return;

  try {
    const token = localStorage.getItem("cubax_token");
    const res   = await fetch(`${BACKEND_URL}/admin/promos/${id}/delete`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      await loadPromos();
    } else {
      alert("Error: " + data.error);
    }
  } catch (err) {
    alert("Error de conexión");
  }
};

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("settings")}
          className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Promociones
          </h1>
          <p className="text-[10px] text-gray-400">
            {promos.length} promos totales
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowModal(true)}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Nueva
        </Button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-8">
          <Loader2 className="h-6 w-6 text-brand-500 animate-spin mx-auto" />
        </div>
      ) : promos.length === 0 ? (
        <Card padding="lg" className="text-center">
          <Megaphone className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Sin promociones creadas</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {promos.map((promo) => (
            <Card key={promo.id} padding="md" className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  {promo.imageUrl ? (
                    <img src={promo.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{promo.emoji}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {promo.title}
                    </p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      promo.active
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-gray-500/10 text-gray-500"
                    }`}>
                      {promo.active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 line-clamp-2">
                    {promo.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(promo.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold ${
                    promo.active
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-emerald-500/10 text-emerald-500"
                  }`}
                >
                  {promo.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal crear */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Nueva promo
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <Input
              label="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Nueva integración USDC"
            />

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Explica la novedad..."
                rows={3}
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Emoji
              </label>
              <input
                type="text"
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="w-full px-4 py-3 text-2xl text-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Imagen (opcional)
              </label>
              {form.imageUrl ? (
                <div className="relative">
                  <img src={form.imageUrl} alt="" className="w-full h-32 object-cover rounded-xl" />
                  <button
                    onClick={() => setForm({ ...form, imageUrl: "" })}
                    className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                  ) : (
                    <>
                      <Upload className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-400 font-semibold">Subir imagen</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <Input
              label="Botón texto (opcional)"
              value={form.buttonText}
              onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
              placeholder="Ej: Ver ahora"
            />

            <Input
              label="Botón link (view interno o URL)"
              value={form.buttonLink}
              onChange={(e) => setForm({ ...form, buttonLink: e.target.value })}
              placeholder="Ej: wallet o https://..."
            />

            <div className="flex gap-2 pt-2">
              <Button variant="outline" fullWidth onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                fullWidth
                loading={saving}
                onClick={handleCreate}
                disabled={!form.title || !form.description}
              >
                Crear promo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
 }
