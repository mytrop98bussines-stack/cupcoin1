import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Globe, Check, Clock } from "lucide-react";

const LANGUAGES = [
  {
    code:      "es",
    name:      "Español",
    native:    "Español (Cuba)",
    flag:      "🇨🇺",
    available: true,
  },
  {
    code:      "en",
    name:      "English",
    native:    "English (US)",
    flag:      "🇺🇸",
    available: false,
  },
  {
    code:      "pt",
    name:      "Português",
    native:    "Português (BR)",
    flag:      "🇧🇷",
    available: false,
  },
];

export function LanguagePage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Globe className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Idioma
          </h1>
          <p className="text-xs text-gray-400">
            Selecciona tu idioma preferido
          </p>
        </div>
      </div>

      {/* Lista de idiomas */}
      <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {LANGUAGES.map((lang) => (
          <div
            key={lang.code}
            className={`flex items-center gap-3 px-4 py-4 transition-colors ${
              lang.available
                ? "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                : "opacity-60"
            }`}
          >
            {/* Flag */}
            <span className="text-2xl">{lang.flag}</span>

            {/* Info */}
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {lang.name}
              </p>
              <p className="text-xs text-gray-400">{lang.native}</p>
            </div>

            {/* Estado */}
            {lang.available ? (
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">
                  Activo
                </Badge>
                <div className="h-5 w-5 rounded-full bg-brand-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold">
                <Clock className="h-3 w-3" />
                Próximamente
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Info */}
      <Card
        padding="md"
        className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5"
      >
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          🌎 Estamos trabajando para agregar más idiomas. Si quieres
          contribuir con la traducción de CubaX a tu idioma, contáctanos
          en{" "}
          <strong className="text-brand-500">soporte@cubax.app</strong>
        </p>
      </Card>
    </div>
  );
}