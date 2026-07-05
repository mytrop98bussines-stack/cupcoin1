import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Check, X } from "lucide-react";

interface KYCListProps {
  users: any[];
  onAction: (userId: string, action: "approve" | "reject") => void;
  loading: string | null;
}

export function KYCList({ users, onAction, loading }: KYCListProps) {
  if (users.length === 0) return <p className="text-center text-gray-500 py-10">No hay solicitudes pendientes.</p>;

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Card key={user.id} padding="md" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full"><User className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="font-bold">{user.fullName || "Sin nombre"}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="success" onClick={() => onAction(user.id, "approve")} disabled={!!loading}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="danger" onClick={() => onAction(user.id, "reject")} disabled={!!loading}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

