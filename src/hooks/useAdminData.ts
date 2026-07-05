import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export function useAdminData() {
  const [data, setData] = useState({ pendingUsers: [], disputes: [], payments: [], loading: true });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => {
      setData(prev => ({ ...prev, pendingUsers: s.docs.map(d => ({ id: d.id, ...d.data() })).filter((u: any) => u.kycStatus === "pending") as any }));
    });
    const unsubDisputes = onSnapshot(query(collection(db, "system_alerts"), orderBy("createdAt", "desc")), (s) => {
      setData(prev => ({ ...prev, disputes: s.docs.map(d => ({ id: d.id, ...d.data() })) as any }));
    });
    const unsubPayments = onSnapshot(collection(db, "memberships"), (s) => {
      setData(prev => ({ ...prev, payments: s.docs.map(d => ({ id: d.id, ...d.data() })) as any, loading: false }));
    });
    return () => { unsubUsers(); unsubDisputes(); unsubPayments(); };
  }, []);
  return data;
}
