import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export function useAdminData() {
  const [data, setData] = useState({
    pendingUsers: [],
    disputes: [],
    payments: [],
    loading: true,
  });

  useEffect(() => {
    // Suscripción a usuarios pendientes (KYC)
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((u: any) => u.kycStatus === "pending");
      setData(prev => ({ ...prev, pendingUsers: users as any }));
    });

    // Suscripción a disputas
    const unsubDisputes = onSnapshot(
      query(collection(db, "system_alerts"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const d = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setData(prev => ({ ...prev, disputes: d as any }));
      }
    );

    // Suscripción a pagos (Memberships)
    const unsubPayments = onSnapshot(collection(db, "memberships"), (snapshot) => {
      const p = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(prev => ({ ...prev, payments: p as any, loading: false }));
    });

    return () => {
      unsubUsers();
      unsubDisputes();
      unsubPayments();
    };
  }, []);

  return data;
}

