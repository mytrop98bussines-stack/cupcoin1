import { useState } from "react";
import { useAdminData } from "@/hooks/useAdminData";
import { AdminLayout }  from "@/components/admin/AdminLayout";
import { KYCList }        from "@/components/admin/KYCList";
import { DisputeList }    from "@/components/admin/DisputeList";
import { MembershipList } from "@/components/admin/MembershipList";
import { ReportsList }    from "@/components/admin/ReportsList";
import { AdminStats } from "@/components/admin/AdminStats"; 
import { Badge }   from "@/components/ui/Badge";
import { Shield, Gavel, Crown, Loader2, Flag, } from "lucide-react";

type AdminTab = "kyc" | "disputes" | "memberships" | "reports" | "stats"; 

export function AdminKYCPage() {
  const { pendingUsers, disputes, payments, loading } = useAdminData();
  const [activeTab, setActiveTab] = useState<AdminTab>("kyc");

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-32 space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
          <p className="text-sm text-gray-400">Cargando panel admin...</p>
        </div>
      </AdminLayout>
    );
  }

  const tabs = [
    {
      key:   "kyc"         as AdminTab,
      label: "KYC",
      icon:  <Shield className="h-3.5 w-3.5" />,
      count: pendingUsers.length,
      color: "text-amber-500",
    },
    {
      key:   "disputes"    as AdminTab,
      label: "Disputas",
      icon:  <Gavel  className="h-3.5 w-3.5" />,
      count: disputes.length,
      color: "text-red-500",
    },
    {
      key:   "memberships" as AdminTab,
      label: "Membresías",
      icon:  <Crown  className="h-3.5 w-3.5" />,
      count: payments.length,
      color: "text-blue-500",
    },
    {
      key:   "reports"     as AdminTab,
      label: "Reportes",
      icon:  <Flag   className="h-3.5 w-3.5" />,
      count: reports.length,
      color: "bg-red-700",
    },
    {
    key:   "stats"  as AdminTab,
    label: "Stats",
    icon:  <TrendingUp className="h-3.5 w-3.5" />,
    count: 0,
    color: "bg-brand-500",
  },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Panel Admin
            </h1>
            <p className="text-xs text-gray-400">
              Administración interna de CubaX
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          En tiempo real
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={`h-4 w-4 rounded-full text-white text-[9px] font-black flex items-center justify-center ${
                tab.key === "kyc"         ? "bg-amber-500" :
                tab.key === "disputes"    ? "bg-red-500"   :
                                           "bg-blue-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {activeTab === "kyc"         && <KYCList        users={pendingUsers} />}
      {activeTab === "disputes"    && <DisputeList     disputes={disputes}  />}
      {activeTab === "memberships" && <MembershipList  payments={payments}  />}
      {activeTab === "stats"       && <AdminStats />}
    </AdminLayout>
  );
                }
