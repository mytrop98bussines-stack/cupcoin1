import { useState } from "react";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge }  from "@/components/ui/Badge";
import { AlertTriangle, CheckCircle2, Flag } from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

const REASON_LABELS: Record<string, string> = {
  scam:          "🚨 Estafa / Fraude",
  fake_profile:  "🎭 Perfil falso",
  spam:          "📨 Spam",
  inappropriate: "⚠️ Comportamiento inapropiado",
  other:         "📝 Otro",
};

interface Props {
  reports: any[];
}

export function ReportsList({ reports }: Props) {
  const [loading, setLoading]   = useState<string | null>(null);
  const [resolved, setResolved] = useState<string[]>([]);

  const pendingReports = reports.filter(
    (r) => !resolved.includes(r.id) && r.status === "pending"
  );

  const handleResolve = async (reportId: string) => {
    setLoading(reportId);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/admin/reports/resolve`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ reportId }),
      });
      const data = await res.json();
      if (data.success) {
        setResolved((prev) => [...prev, reportId]);
      }
    } catch (err) {
      console.error("❌ Error resolviendo reporte:", err);
    } finally {
      setLoading(null);
    }
  };

  if (pendingReports.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Flag className="mx-auto h-12 w-12 opacity-20 mb-3" />
        <p className="font-semibold">No hay reportes pendientes.</p>
        <p className="text-xs mt-1">¡Todo está al día!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Reportes pendientes ({pendingReports.length})
      </h2>

      {pendingReports.map((report) => (
        <Card
          key={report.id}
          padding="md"
          className="border-l-4 border-l-red-500 space-y-3"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">
                {REASON_LABELS[report.reason] || report.reason}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date(report.createdAt).toLocaleString("es-CU")}
              </p>
            </div>
            {report.totalReports >= 3 && (
              <Badge variant="danger" size="sm">
                🚨 {report.totalReports} reportes
              </Badge>
            )}
          </div>

          {/* Partes */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 mb-0.5">Reportado por</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {report.fromName}
              </p>
              <p className="text-[9px] text-gray-400 font-mono">
                {report.fromUserId?.slice(0, 8)}...
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-2">
              <p className="text-[10px] text-gray-400 mb-0.5">Usuario reportado</p>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">
                {report.toName}
              </p>
              <p className="text-[9px] text-gray-400 font-mono">
                {report.toUserId?.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Descripción */}
          {report.description && (
            <div className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">
                Descripción
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                "{report.description}"
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              loading={loading === report.id}
              onClick={() => handleResolve(report.id)}
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Marcar revisado
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                // Aquí puedes navegar al perfil del usuario reportado
                // o suspender la cuenta
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              Ver usuario
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
