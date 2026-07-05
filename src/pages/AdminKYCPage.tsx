import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useAdminData } from "@/hooks/useAdminData";
import { KYCList } from "../components/admin/KYCList";
import { DisputeList } from "../components/admin/DisputeList";
import { MembershipList } from "../components/admin/MembershipList";

export function AdminKYCPage() {
  const { user } = useAppStore();
  const { pendingUsers, disputes, payments, loading } = useAdminData();
  const [activeTab, setActiveTab] = useState("kyc");

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="p-6">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab("kyc")}>KYC ({pendingUsers.length})</button>
        <button onClick={() => setActiveTab("disputes")}>Disputas ({disputes.length})</button>
        <button onClick={() => setActiveTab("memberships")}>Membresías</button>
      </div>
      {activeTab === "kyc" && <KYCList users={pendingUsers} />}
      {activeTab === "disputes" && <DisputeList disputes={disputes} userId={user?.uid} />}
      {activeTab === "memberships" && <MembershipList payments={payments} />}
    </div>
  );
}
