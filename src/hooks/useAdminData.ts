import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { User, Dispute, MembershipPayment } from "@/types"; // Importa tus tipos

export function useAdminData() {
  const [data, setData] = useState({ 
    pendingUsers: [] as User[], 
    disputes: [] as Dispute[], 
    payments: [] as MembershipPayment[], 
    loading: true 
  });

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (s) => {
      setData(prev => ({ ...prev, pendingUsers: s.docs.map(d => ({ id: d.id, ...d.data() })) as User[] }));
    });
    const unsubDisputes = onSnapshot(query(collection(db, "system_alerts"), orderBy("createdAt", "desc")), (s) => {
      setData(prev => ({ ...prev, disputes: s.docs.map(d => ({ id: d.id, ...d.data() })) as Dispute[] }));
    });
    const unsubPayments = onSnapshot(collection(db, "memberships"), (s) => {
      setData(prev => ({ ...prev, payments: s.docs.map(d => ({ id: d.id, ...d.data() })) as MembershipPayment[], loading: false }));
    });
    return () => { unsubUsers(); unsubDisputes(); unsubPayments(); };
  }, []);
  return data;
}
