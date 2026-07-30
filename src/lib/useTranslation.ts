import { useAppStore } from "@/store/useAppStore";
import { t as translate } from "./i18n";

export function useTranslation() {
  const language = useAppStore((state) => state.language);

  const t = (key: string, params?: Record<string, string | number>): string => {
    return translate(key, language, params);
  };

  return { t, language };
}
