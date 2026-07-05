import { db } from "@/lib/firebase/config";
import { doc, updateDoc, addDoc } from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function KYCList({ users }: { users: any[] }) {
  const handleKycAction = async (userId: string, status: "verified" | "rejected") => {
    await updateDoc(doc(db, "users", userId), { kycStatus: status });
    await addDoc(collection(db, "notifications"), { userId, title: `KYC ${status}`, body: `Tu estado es ${status}`, type: "kyc", read: false, createdAt: Date.now() });
  };

  return <div className="space-y-4">{users.map(u => (
    <Card key={u.id} className="p-4 flex justify-between">
      <span>{u.fullName}</span>
      <div className="flex gap-2">
        <Button onClick={() => handleKycAction(u.id, "verified")}>Aprobar</Button>
        <Button onClick={() => handleKycAction(u.id, "rejected")}>Rechazar</Button>
      </div>
    </Card>
  ))}</div>;
}
