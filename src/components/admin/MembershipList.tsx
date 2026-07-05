// src/components/admin/MembershipList.tsx
import React from "react";
import { Card } from "@/components/ui/Card";
import { DollarSign } from "lucide-react";

interface MembershipListProps {
  payments: any[];
}

export function MembershipList({ payments }: MembershipListProps) {
  return (
    <div className="space-y-3">
      {payments.map((pay) => (
        <Card key={pay.id} padding="md" className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <DollarSign className="text-emerald-500" />
            <div>
              <p className="font-bold text-sm">Pago de Membresía</p>
              <p className="text-xs text-gray-400">Usuario: {pay.userId}</p>
            </div>
          </div>
          <span className="font-mono text-sm">{pay.amount} USD</span>
        </Card>
      ))}
    </div>
  );
}

