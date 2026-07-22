import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import {
  User, Mail, Calendar, Shield, Star,
  Edit3, Award, CheckCircle2,
} from "lucide-react";

export function ProfilePage() {
  const { user, navigate } = useAppStore();

  if (!user) return null;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-CU", {
        month: "long",
        year:  "numeric",
      })
    : "—";

  const kycConfig = {
    verified:             { label: "Verificado ✓",  variant: "success" as const },
    pending_verification: { label: "En revisión",   variant: "info"    as const },
    unverified:           { label: "Sin verificar", variant: "warning" as const },
    rejected:             { label: "Rechazado",     variant: "danger"  as const },
  };

  const kyc = kycConfig[user.kycStatus as keyof typeof kycConfig]
    || kycConfig.unverified;

  const rating = (user as any).rating || 5;
  const stars  = Math.round(rating);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
          <User className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
          <p className="text-xs text-gray-400">Información pública de tu cuenta</p>
        </div>
      </div>

      {/* Perfil principal */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-24 w-24 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar
              name={user.displayName}
              src={user.photoURL}
              size="lg"
            />
            {(user as any).verifiedTrader && (
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-white dark:border-gray-900">
                <VerifiedBadge verified={true} size="md" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                {user.displayName}
              </h2>
              {user.role === "admin" && (
                <Badge variant="danger" size="sm">Admin</Badge>
              )}
            </div>

            {(user as any).verifiedTrader && (
              <div className="flex items-center gap-1 mt-1">
                <Award className="h-3 w-3 text-blue-500" />
                <span className="text-[11px] font-bold text-blue-500">
                  Trader Verificado
                </span>
              </div>
            )}

            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`text-sm ${s <= stars ? "opacity-100" : "opacity-20"}`}
                >
                  ⭐
                </span>
              ))}
              <span className="text-xs font-bold text-gray-900 dark:text-white ml-1">
                {rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">
                ({(user as any).totalReviews || 0} reseñas)
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={kyc.variant} size="sm">
                {kyc.label}
              </Badge>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          fullWidth
          variant="outline"
          onClick={() => navigate("settings")}
          icon={<Edit3 className="h-3.5 w-3.5" />}
          className="mt-4"
        >
          Editar perfil
        </Button>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-2">
        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <Star className="h-3.5 w-3.5 text-brand-500" />
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Trades</p>
          </div>
          <p className="text-xl font-black text-gray-900 dark:text-white">
            {user.totalTrades || 0}
          </p>
        </Card>

        <Card padding="md">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase">Rating</p>
          </div>
          <p className="text-xl font-black text-gray-900 dark:text-white">
            {rating.toFixed(1)} ⭐
          </p>
        </Card>
      </div>

      {/* Info personal */}
      <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.05]">
        {[
          { icon: Mail,     label: "Correo",          value: user.email },
          { icon: Calendar, label: "Miembro desde",   value: memberSince },
          { icon: Shield,   label: "Estado KYC",      value: kyc.label },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-4 py-3.5">
            <div className="h-8 w-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center flex-shrink-0">
              <item.icon className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </Card>

      {/* KYC no verificado */}
      {user.kycStatus !== "verified" && (
        <Card padding="md" className="bg-amber-500/10 border-amber-500/20">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                Verifica tu identidad
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                Sube tu documento para operar en el P2P sin restricciones.
              </p>
              <Button
                size="sm"
                onClick={() => navigate("kyc")}
                className="bg-amber-500 hover:bg-amber-600"
              >
                Verificar ahora
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
