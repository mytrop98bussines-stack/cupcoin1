import { useState } from "react";
import { useAdminData } from "@/hooks/useAdminData";
import { KYCList } from "@/components/admin/KYCList";
import { DisputeList } from "@/components/admin/DisputeList";
import { MembershipList } from "@/components/admin/MembershipList";
import { Loader2 } from "lucide-react";

export function AdminKYCPage() {
  const { pendingUsers, disputes, payments, loading } = useAdminData();
  const [activeTab, setActiveTab] = useState<"kyc" | "disputes" | "memberships">("kyc");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Panel Administrativo</h1>
      
      <div className="flex gap-4 border-b mb-6 pb-2">
        <button onClick={() => setActiveTab("kyc")} className={activeTab === "kyc" ? "font-bold text-blue-600" : ""}>KYC ({pendingUsers.length})</button>
        <button onClick={() => setActiveTab("disputes")} className={activeTab === "disputes" ? "font-bold text-blue-600" : ""}>Disputas ({disputes.length})</button>
        <button onClick={() => setActiveTab("memberships")} className={activeTab === "memberships" ? "font-bold text-blue-600" : ""}>Membresías ({payments.length})</button>
      </div>

      {activeTab === "kyc" && <KYCList users={pendingUsers} />}
      {activeTab === "disputes" && <DisputeList disputes={disputes} />}
      {activeTab === "memberships" && <MembershipList payments={payments} />}
    </div>
  );
          }
