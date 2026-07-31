import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, AlertTriangle, Loader2, RotateCw } from "lucide-react";

interface QRScannerProps {
  onScan:  (data: any) => void;
  onClose: () => void;
}

export function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [starting, setStarting]   = useState(true);
  const [cameras, setCameras]     = useState<any[]>([]);
  const [currentCamera, setCurrentCamera] = useState<string | null>(null);

  // ─── Iniciar el escáner ────────────────────────────────
  const startScanner = async (cameraId?: string) => {
    try {
      setStarting(true);
      setError(null);

      // Detener cualquier instancia previa
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }

      const html5QrCode = new Html5Qrcode("qr-reader-region");
      scannerRef.current = html5QrCode;

      // Obtener cámaras disponibles
      const devices = await Html5Qrcode.getCameras();
      setCameras(devices);

      // Elegir cámara: la trasera por defecto o la seleccionada
      let selectedCamera = cameraId;
      if (!selectedCamera) {
        // Buscar cámara trasera
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment") ||
            d.label.toLowerCase().includes("trasera")
        );
        selectedCamera = backCamera?.id || devices[devices.length - 1]?.id;
      }

      setCurrentCamera(selectedCamera || null);

      // ✅ Configuración corregida para evitar rotación y duplicación
      const config = {
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const boxSize = Math.floor(minEdge * 0.7);
          return { width: boxSize, height: boxSize };
        },
        aspectRatio: 1.0,
        // ✅ Esta línea evita la duplicación
        disableFlip: false,
        // ✅ Video constraints mejorados
        videoConstraints: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const successCallback = (decodedText: string) => {
        try {
          const data = JSON.parse(decodedText);

          if (data.type !== "CUBAX_PAYMENT") {
            setError("QR no válido — no es un pago de CubaX");
            return;
          }

          if (data.expiresAt && Date.now() > data.expiresAt) {
            setError("Este QR ha expirado. Pide al vendedor uno nuevo.");
            return;
          }

          html5QrCode.stop().catch(() => {});
          onScan(data);
        } catch (err) {
          setError("QR no válido — formato incorrecto");
        }
      };

      const errorCallback = () => {
        // Silenciamos errores continuos de "no encuentra QR"
      };

      // ✅ Usa el ID de la cámara en lugar de facingMode
      await html5QrCode.start(
        selectedCamera || { facingMode: "environment" },
        config,
        successCallback,
        errorCallback
      );

      setStarting(false);
    } catch (err: any) {
      console.error("Error iniciando cámara:", err);
      setError("No se pudo acceder a la cámara. Verifica permisos.");
      setStarting(false);
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // ─── Cambiar de cámara ─────────────────────────────────
  const switchCamera = async () => {
    if (cameras.length < 2) return;

    const currentIndex = cameras.findIndex((c) => c.id === currentCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    await startScanner(nextCamera.id);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-white" />
          <h3 className="text-sm font-bold text-white">Escanear QR de pago</h3>
        </div>
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <button
              onClick={switchCamera}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
              title="Cambiar cámara"
            >
              <RotateCw className="h-4 w-4 text-white" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Cámara — con estilos corregidos */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-black">
        {/* ✅ Contenedor con dimensiones controladas */}
        <div
          id="qr-reader-region"
          className="w-full max-w-md aspect-square"
          style={{
            maxHeight: "70vh",
            objectFit: "cover",
          }}
        />

        {starting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3 z-20">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <p className="text-white text-sm font-semibold">
              Iniciando cámara...
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 bottom-24 flex items-start gap-2 p-3 rounded-xl bg-red-500/90 backdrop-blur-sm z-20">
            <AlertTriangle className="h-4 w-4 text-white flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  startScanner(currentCamera || undefined);
                }}
                className="text-xs text-white/80 underline mt-1"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="p-4 bg-black/80 backdrop-blur-sm text-center z-10">
        <p className="text-xs text-white/70 font-medium">
          Enfoca el QR del vendedor dentro del recuadro
        </p>
        {cameras.length > 1 && (
          <p className="text-[10px] text-white/50 mt-1">
            Tienes {cameras.length} cámaras disponibles — toca 🔄 para cambiar
          </p>
        )}
      </div>
    </div>
  );
          }
