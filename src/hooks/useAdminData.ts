import { useState, useEffect } from "react";
import type { User, Dispute, MembershipPayment } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface AdminData {
  pendingUsers: User[];
  disputes:     Dispute[];
  payments:     MembershipPayment[];
  reports:      any[];           // ← nuevo
  loading:      boolean;
}

export function useAdminData(): AdminData {
  const [data, setData] = useState<AdminData>({
    pendingUsers: [],
    disputes:     [],
    payments:     [],
    reports:      [],            // ← nuevo
    loading:      true,
  });

  useEffect(() => {
    let stopped = false;

    const loadAdminData = async () => {
      if (stopped) return;

      try {
        const token   = localStorage.getItem("cubax_token");
        const headers = {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        };

        const [usersRes, disputesRes, paymentsRes, reportsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/admin/kyc/pending`,     { headers }),
          fetch(`${BACKEND_URL}/admin/disputes`,         { headers }),
          fetch(`${BACKEND_URL}/admin/payments/pending`, { headers }),
          fetch(`${BACKEND_URL}/admin/reports`,          { headers }), // ← nuevo
        ]);

        const [usersData, disputesData, paymentsData, reportsData] = await Promise.all([
          usersRes.json(),
          disputesRes.json(),
          paymentsRes.json(),
          reportsRes.json(),     // ← nuevo
        ]);

        if (!stopped) {
          setData({
            pendingUsers: usersData.success    ? usersData.users        : [],
            disputes:     disputesData.success ? disputesData.disputes   : [],
            payments:     paymentsData.success ? paymentsData.payments   : [],
            reports:      reportsData.success  ? reportsData.reports     : [], // ← nuevo
            loading:      false,
          });
        }
      } catch (err) {
        console.error("❌ Error cargando datos admin:", err);
        if (!stopped) {
          setData((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    void loadAdminData();
    const intervalId = window.setInterval(loadAdminData, 30000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return data;
}
