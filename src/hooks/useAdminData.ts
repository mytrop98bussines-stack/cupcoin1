import { useState, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import {
  collection, onSnapshot, query,
  orderBy, where,
} from "firebase/firestore";
import type { User, Dispute, MembershipPayment } from "@/types";

interface AdminData {
  pendingUsers: User[];
  disputes:     Dispute[];
  payments:     MembershipPayment[];
  loading:      boolean;
}

export function useAdminData(): AdminData {
  const [data, setData] = useState<AdminData>({
    pendingUsers: [],
    disputes:     [],
    payments:     [],
    loading:      true,
  });

  useEffect(() => {
    // ✅ Solo usuarios con KYC pendiente
    const unsubUsers = onSnapshot(
      query(
        collection(db, "users"),
        where("kycStatus", "==", "pending_verification")
      ),
      (snapshot) => {
        const pendingUsers = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as User[];
        setData((prev) => ({ ...prev, pendingUsers }));
      },
      (err) => console.error("Error users:", err.message)
    );

    // ✅ Disputas desde system_alerts no resueltas
    const unsubDisputes = onSnapshot(
      query(
        collection(db, "system_alerts"),
        where("tipo",     "==", "trade_disputado"),
        where("resuelto", "==", false),
        orderBy("timestamp", "desc")
      ),
      (snapshot) => {
        const disputes = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id:          d.id,
            tradeId:     data.tradeId     || "",
            buyerId:     data.buyerId     || "",
            buyerName:   data.buyerName   || "Comprador",
            sellerId:    data.sellerId    || "",
            sellerName:  data.sellerName  || "Vendedor",
            asset:       data.asset       || "USDT",
            amount:      data.amount      || 0,
            initiatedBy: data.disputadoPor || "",
            reason:      data.descripcion  || "",
            status:      "open" as const,
            createdAt:   data.timestamp   || Date.now(),
          } as Dispute;
        });
        setData((prev) => ({ ...prev, disputes }));
      },
      (err) => console.error("Error disputes:", err.message)
    );

    // ✅ Pagos de membresía pendientes
    const unsubPayments = onSnapshot(
      query(
        collection(db, "membership_payments"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc")
      ),
      (snapshot) => {
        const payments = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MembershipPayment[];
        setData((prev) => ({ ...prev, payments, loading: false }));
      },
      (err) => {
        console.error("Error payments:", err.message);
        setData((prev) => ({ ...prev, loading: false }));
      }
    );

    return () => {
      unsubUsers();
      unsubDisputes();
      unsubPayments();
    };
  }, []);

  return data;
            }
