import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { CheckCircle2 } from "lucide-react";
import type { Language } from "@/lib/i18n";

export function LanguagePage() {
  const { language, setLanguage, navigate } = useAppStore();

  const languages = [
    { code: "es" as Language, label: "Español", flag: "🇨🇺", desc: "Español (Cuba)" },
    { code: "en" as Language, label: "English", flag: "🇺🇸", desc: "English (US)"   },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
        Idioma / Language
      </h1>

      <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.06] overflow-hidden">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
          >
            <span className="text-2xl">{lang.flag}</span>
            <div className="flex-1">
              <p className="font-bold text-sm text-gray-900 dark:text-white">
                {lang.label}
              </p>
              <p className="text-xs text-gray-400">{lang.desc}</p>
            </div>
            {language === lang.code && (
              <CheckCircle2 className="h-5 w-5 text-brand-500" />
            )}
          </button>
        ))}
      </Card>

      <p className="text-xs text-gray-400 text-center">
        {language === "es"
          ? "Más idiomas próximamente"
          : "More languages coming soon"}
      </p>
    </div>
  );
}
