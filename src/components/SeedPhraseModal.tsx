import { useState } from "react";
import { Shield, Copy, CheckCircle2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SeedPhraseModalProps {
  seedPhrase: string;
  address:    string;
  onConfirmed: () => void;
}

export function SeedPhraseModal({ seedPhrase, address, onConfirmed }: SeedPhraseModalProps) {
  const [copied,    setCopied]    = useState(false);
  const [revealed,  setRevealed]  = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const words = seedPhrase.split(" ");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(seedPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden">

        {/* Header */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-5 text-center">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            ⚠️ Guarda tu frase secreta
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Estas 12 palabras son la única forma de recuperar tu wallet.
            Nadie puede ayudarte si las pierdes.
          </p>
        </div>

        <div className="p-5 space-y-4">

          {/* Dirección */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
              Tu dirección pública
            </p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {address}
            </p>
          </div>

          {/* Frase semilla */}
          <div className="relative">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  Frase de recuperación (12 palabras)
                </p>
                <button
                  onClick={() => setRevealed(!revealed)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {revealed
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye    className="h-4 w-4" />
                  }
                </button>
              </div>

              {/* Grid de palabras */}
              {revealed ? (
                <div className="grid grid-cols-3 gap-2">
                  {words.map((word, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    >
                      <span className="text-[9px] text-gray-400 w-4 text-right font-mono">
                        {i + 1}.
                      </span>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        {word}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {words.map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 p-2 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    >
                      <span className="text-[9px] text-gray-400 w-4 text-right font-mono">
                        {i + 1}.
                      </span>
                      <span className="text-xs font-semibold text-gray-300 dark:text-gray-600 select-none">
                        ••••••
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón copiar */}
            {revealed && (
              <button
                onClick={handleCopy}
                className="absolute top-4 right-10 text-gray-400 hover:text-brand-500 transition-colors"
              >
                {copied
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : <Copy         className="h-4 w-4" />
                }
              </button>
            )}
          </div>

          {/* Advertencia */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-red-700 dark:text-red-400">
                Nunca compartas estas palabras
              </p>
              <p className="text-[10px] text-red-600 dark:text-red-500">
                • Anótalas en papel físico<br />
                • No las guardes en fotos ni notas digitales<br />
                • CubaX nunca te las pedirá
              </p>
            </div>
          </div>

          {/* Checkbox confirmación */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Confirmo que he anotado mis 12 palabras en un lugar seguro y entiendo que
              <strong className="text-gray-900 dark:text-white"> no podrán recuperarse </strong>
              si las pierdo.
            </span>
          </label>

          {/* Botón continuar */}
          <Button
            size="lg"
            fullWidth
            disabled={!confirmed || !revealed}
            onClick={onConfirmed}
            className="shadow-lg shadow-brand-500/20"
          >
            {!revealed
              ? "👁️ Primero revela tus palabras"
              : !confirmed
              ? "✅ Confirma que las anotaste"
              : "Continuar al Dashboard →"
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
