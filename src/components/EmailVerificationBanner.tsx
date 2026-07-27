import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Mail, ChevronRight } from "lucide-react";
import { EmailVerificationModal } from "./EmailVerificationModal";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function EmailVerifyBanner() {
  const { user } = useAppStore();

  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [showModal, setShowModal]         = useState(false);
  const [dismissed, setDismissed]         = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    // Verificar si el usuario ya cerró el banner esta sesión
    const dismissedKey = `email_banner_dismissed_${user.uid}`;
    const wasDismissed = sessionStorage.getItem(dismissedKey);
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    void checkStatus();
  }, [user?.uid]);

  const checkStatus = async () => {
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/auth/email/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setEmailVerified(data.emailVerified);
      }
    } catch {}
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (user?.uid) {
      sessionStorage.setItem(`email_banner_dismissed_${user.uid}`, "1");
    }
  };

  if (dismissed || emailVerified === null || emailVerified === true || !user?.email) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/50 transition-all group"
      >
        <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0 animate-pulse">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-bold text-amber-900 dark:text-amber-400">
            Verifica tu email
          </p>
          <p className="text-[11px] text-amber-700/70 dark:text-amber-400/70">
            Requerido para operar en P2P y hacer retiros
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
      </button>

      {showModal && (
        <EmailVerificationModal
          email={user.email}
          onClose={() => setShowModal(false)}
          onVerified={() => {
            setEmailVerified(true);
            handleDismiss();
          }}
        />
      )}
    </>
  );
      }
