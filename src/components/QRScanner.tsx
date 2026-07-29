import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertTriangle, Loader2 } from "lucide-react";

interface QRScannerProps {
  onScan:  (data: any) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("qr-reader-region");
    scannerRef.current = html5QrCode;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    const successCallback = (decodedText: string) => {
      try {
        const data = JSON.parse(decodedText);

        // Validar que sea un QR de CubaX
        if (data.type !== "CUBAX_PAYMENT") {
          setError("QR no válido — no es un pago de CubaX");
          return;
        }

        // Validar que no esté expirado
        if (data.expiresAt && Date.now() > data.expiresAt) {
          setError("Este QR ha expirado. Pide al vendedor uno nuevo.");
          return;
        }

        // ✅ Todo OK — detener escáner y pasar los datos
        html5QrCode.stop().catch(() => {});
        onScan(data);
      } catch (err) {
        setError("QR no válido — formato incorrecto");
      }
    };

    const errorCallback = () => {
      // Silenciamos errores continuos de "no encuentra QR"
    };

    html5QrCode
      .start(
        { facingMode: "environment" }, // cámara trasera
        config,
        successCallback,
        errorCallback
      )
      .then(() => setStarting(false))
      .catch((err) => {
        console.error("Error iniciando cámara:", err);
        setError("No se pudo acceder a la cámara. Verifica permisos.");
        setStarting(false);
      });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-white" />
          <h3 className="text-sm font-bold text-white">Escanear QR de pago</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
        >
          <X className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Cámara */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <div id="qr-reader-region" className="w-full max-w-md" />

        {starting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <p className="text-white text-sm font-semibold">
              Iniciando cámara...
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 bottom-24 flex items-start gap-2 p-3 rounded-xl bg-red-500/90 backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4 text-white flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-white/80 underline mt-1"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="p-4 bg-black/80 backdrop-blur-sm text-center">
        <p className="text-xs text-white/70 font-medium">
          Enfoca el QR del vendedor dentro del recuadro
        </p>
      </div>
    </div>
  );
}
