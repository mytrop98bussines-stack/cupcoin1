import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import { Logo }   from "@/components/Logo";
import { useTranslation } from "@/lib/useTranslation";
import {
  Mail, Lock, User, Eye, EyeOff,
  ArrowLeft, CheckCircle2, AlertTriangle, Shield,
} from "lucide-react";
import type { User as AppUser } from "@/types";
import { isBiometricSupported }     from "@/lib/biometric";
import { BiometricActivationModal } from "@/components/BiometricActivationModal";
import { BiometricLoginButton }     from "@/components/BiometricLoginButton";
import { createNewWallet }          from "@/lib/wallet/walletService";
import { restoreWalletFromMnemonic } from "@/lib/wallet/walletService";
import {
  hasStoredWallet,
  getStoredWalletAddress,
}                                   from "@/lib/wallet/walletStorage";
import { SeedPhraseModal }          from "@/components/SeedPhraseModal";
import { WalletRecoveryModal }      from "@/components/WalletRecoveryModal";

const BACKEND_URL = "https://cubax-backend.onrender.com";

export function AuthPage() {
  const { currentView, navigate, login } = useAppStore();
  const { t } = useTranslation();
  const isLogin = currentView === "login";

  // ─── Estados login/registro ───────────────────────────────
  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [name, setName]                   = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [globalError, setGlobalError]     = useState<string | null>(null);
  const [resetSent, setResetSent]         = useState(false);
  const [showReset, setShowReset]         = useState(false);
  const [resetEmail, setResetEmail]       = useState("");
  const [resetLoading, setResetLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ─── Estados 2FA ──────────────────────────────────────────
  const [twoFARequired, setTwoFARequired]             = useState(false);
  const [twoFACode, setTwoFACode]                     = useState("");
  const [twoFAChallengeToken, setTwoFAChallengeToken] = useState("");
  const [twoFALoading, setTwoFALoading]               = useState(false);
  const [twoFAError, setTwoFAError]                   = useState<string | null>(null);

  // ─── Estados Biometría ────────────────────────────────────
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingUserData, setPendingUserData]       = useState<any>(null);

  // ─── Estados Wallet ───────────────────────────────────────
  const [showSeedModal, setShowSeedModal]           = useState(false);
  const [newSeedPhrase, setNewSeedPhrase]           = useState("");
  const [newWalletAddress, setNewWalletAddress]     = useState("");
  const [pendingLoginData, setPendingLoginData]     = useState<any>(null);

  // ─── Estados Recovery ─────────────────────────────────────
  const [showRecoveryModal, setShowRecoveryModal]   = useState(false);

  // =========================================================
  // HELPER: Guardar wallet en backend
  // =========================================================
  const saveWalletToBackend = async (
    uid:           string,
    token:         string,
    walletAddress: string
  ): Promise<boolean> => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/update-wallet`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, walletAddress }),
      });
      const data = await res.json();

      if (!data.success && data.code !== "WALLET_ALREADY_EXISTS") {
        console.error("❌ [Wallet] Error guardando en backend:", data.error);
        return false;
      }

      console.log("✅ [Wallet] Dirección guardada en backend");
      return true;
    } catch (err) {
      console.error("❌ [Wallet] Error de conexión:", err);
      return false;
    }
  };

  // =========================================================
  // HELPER: Flujo post-wallet
  // =========================================================
  const proceedAfterWallet = useCallback((appUser: AppUser, data: any) => {
    const promptedBefore = localStorage.getItem(`biometric_prompted_${data.uid}`);
    const alreadyEnabled = localStorage.getItem("biometric_enabled");

    if (isBiometricSupported() && !promptedBefore && !alreadyEnabled) {
      setPendingUserData({ appUser, data });
      setShowBiometricModal(true);
    } else {
      login(appUser);
      navigate("dashboard");
    }
  }, [login, navigate]);

  // =========================================================
  // HELPER: Completar login + lógica de wallet
  // =========================================================
  const finishLogin = useCallback(async (data: any, pwd?: string) => {
    localStorage.setItem("cubax_token",         data.token);
    localStorage.setItem("cubax_refresh_token", data.refreshToken || "");
    localStorage.setItem("cubax_uid",           data.uid);
    localStorage.setItem("cubax_email",         data.email || "");
    localStorage.setItem("cubax_name",          data.displayName || "");
    localStorage.setItem("cubax_last_login",    Date.now().toString());

    const u = data.userData || {};

    const appUser: AppUser = {
      uid:           data.uid,
      email:         data.email,
      displayName:   data.displayName,
      photoURL:      data.photoURL   || null,
      kycStatus:     u.kycStatus     || "unverified",
      createdAt:     u.createdAt     || Date.now(),
      totalTrades:   u.totalTrades   || 0,
      rating:        u.rating        || 5.0,
      walletAddress: u.walletAddress || null,
      role:          u.role          || "user",
      emailVerified: u.emailVerified || false,
    } as any;

    const walletPassword = pwd || password || data.uid;

    // ─── CASO 1: Usuario nuevo sin wallet en ningún lado ──
    if (!u.walletAddress && !hasStoredWallet()) {
      try {
        console.log("🔑 [Wallet] Generando wallet NUEVA para:", data.uid);
        const walletData = await createNewWallet(walletPassword);

        const saved = await saveWalletToBackend(
          data.uid,
          data.token,
          walletData.address
        );

        if (saved) {
          appUser.walletAddress = walletData.address;
          setNewSeedPhrase(walletData.mnemonic);
          setNewWalletAddress(walletData.address);
          setPendingLoginData({ appUser, data });
          setShowSeedModal(true);
          return;
        }
      } catch (err) {
        console.error("❌ [Wallet] Error generando wallet:", err);
      }
    }

    // ─── CASO 2: Tiene wallet en Firestore pero NO en localStorage ──
    // Cambió de dispositivo o limpió caché
    if (u.walletAddress && !hasStoredWallet()) {
      console.warn("⚠️ [Wallet] Wallet en Firestore pero no en dispositivo");
      setNewWalletAddress(u.walletAddress);
      setPendingLoginData({ appUser, data });
      setShowRecoveryModal(true);
      return;
    }

    // ─── CASO 3: Tiene wallet en localStorage ─────────────
    // Verificar que coincide con Firestore
    if (hasStoredWallet()) {
      const storedAddress = getStoredWalletAddress();
      if (u.walletAddress && storedAddress !== u.walletAddress) {
        console.error("❌ [Wallet] MISMATCH localStorage vs Firestore");
        console.error("localStorage:", storedAddress);
        console.error("Firestore:",    u.walletAddress);
        // La de Firestore es la oficial
        appUser.walletAddress = u.walletAddress;
      }
    }

    proceedAfterWallet(appUser, data);
  }, [password, proceedAfterWallet]);

  // =========================================================
  // HANDLER: Usuario confirma frase semilla
  // =========================================================
  const handleSeedConfirmed = useCallback(() => {
    setShowSeedModal(false);
    setNewSeedPhrase("");
    setNewWalletAddress("");

    if (!pendingLoginData) return;
    const { appUser, data } = pendingLoginData;
    setPendingLoginData(null);
    proceedAfterWallet(appUser, data);
  }, [pendingLoginData, proceedAfterWallet]);

  // =========================================================
  // HANDLER: Wallet recuperada con frase semilla
  // =========================================================
  const handleWalletRecovered = useCallback(() => {
    setShowRecoveryModal(false);

    if (!pendingLoginData) return;
    const { appUser, data } = pendingLoginData;

    // Actualizar con la dirección recuperada del localStorage
    const recoveredAddress = getStoredWalletAddress();
    if (recoveredAddress) {
      appUser.walletAddress = recoveredAddress;
    }

    setPendingLoginData(null);
    proceedAfterWallet(appUser, data);
  }, [pendingLoginData, proceedAfterWallet]);

  // =========================================================
  // HANDLER: Saltar recuperación (solo lectura)
  // =========================================================
  const handleRecoverySkip = useCallback(() => {
    setShowRecoveryModal(false);

    if (!pendingLoginData) return;
    const { appUser, data } = pendingLoginData;
    setPendingLoginData(null);
    proceedAfterWallet(appUser, data);
  }, [pendingLoginData, proceedAfterWallet]);

  // =========================================================
  // HANDLERS: Biometría
  // =========================================================
  const handleBiometricActivated = () => {
    localStorage.setItem("biometric_enabled", "1");
    if (pendingUserData) {
      localStorage.setItem(
        `biometric_prompted_${pendingUserData.data.uid}`, "1"
      );
      login(pendingUserData.appUser);
      navigate("dashboard");
      setPendingUserData(null);
    }
    setShowBiometricModal(false);
  };

  const handleBiometricSkip = () => {
    if (pendingUserData) {
      localStorage.setItem(
        `biometric_prompted_${pendingUserData.data.uid}`, "1"
      );
      login(pendingUserData.appUser);
      navigate("dashboard");
      setPendingUserData(null);
    }
    setShowBiometricModal(false);
  };

  // =========================================================
  // EFFECT: Google OAuth callback
  // =========================================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const error          = params.get("error");
    const requires2FA    = params.get("requires2FA");
    const challengeToken = params.get("challengeToken");
    const token          = params.get("token");
    const refreshToken   = params.get("refreshToken");
    const uid            = params.get("uid");

    const clearUrl = () => {
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    if (!error && !requires2FA && !token) return;

    if (error) {
      setGlobalError(decodeURIComponent(error));
      clearUrl();
      setGoogleLoading(false);
      return;
    }

    if (requires2FA === "1" && challengeToken) {
      setTwoFAChallengeToken(challengeToken);
      setTwoFARequired(true);
      setTwoFACode("");
      setTwoFAError(null);
      setGoogleLoading(false);
      clearUrl();
      return;
    }

    if (token && uid) {
      clearUrl();
      setGoogleLoading(true);

      fetch(`${BACKEND_URL}/api/auth/me`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid }),
      })
        .then((r) => r.json())
        .then((me) => {
          if (!me.success) {
            setGlobalError(t("auth.errors.loadUser"));
            return;
          }
          finishLogin({
            token,
            refreshToken: refreshToken || "",
            uid,
            email:        me.userData.email,
            displayName:  me.userData.displayName,
            photoURL:     me.userData.photoURL || null,
            userData:     me.userData,
          }, uid);
        })
        .catch(() => setGlobalError(t("auth.errors.googleSession")))
        .finally(() => setGoogleLoading(false));
    }
  }, [finishLogin, t]);

  // =========================================================
  // VALIDACIÓN
  // =========================================================
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = t("auth.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t("auth.errors.emailInvalid");
    }

    if (!password) {
      newErrors.password = t("auth.errors.passwordRequired");
    } else if (password.length < 6) {
      newErrors.password = t("auth.errors.passwordShort");
    }

    if (!isLogin && !name.trim()) {
      newErrors.name = t("auth.errors.nameRequired");
    }

    if (!isLogin && name.trim().length < 2) {
      newErrors.name = t("auth.errors.nameShort");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, name, isLogin, t]);

  // =========================================================
  // HANDLER: Google Login
  // =========================================================
  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    setGlobalError(null);
    window.location.href = `${BACKEND_URL}/auth/google/start`;
  };

  // =========================================================
  // HANDLER: Submit login/registro
  // =========================================================
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      setErrors({});
      setGlobalError(null);

      try {
        const endpoint = isLogin
          ? `${BACKEND_URL}/api/auth/login`
          : `${BACKEND_URL}/api/auth/register`;

        const body = isLogin
          ? { email: email.trim(), password }
          : { email: email.trim(), password, displayName: name.trim() };

        const res  = await fetch(endpoint, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });

        const data = await res.json();

        if (!data.success) {
          if (data.code === "EMAIL_EXISTS" || data.code === "INVALID_EMAIL") {
            setErrors({ email: data.error });
          } else if (
            data.code === "INVALID_PASSWORD" ||
            data.code === "INVALID_LOGIN_CREDENTIALS"
          ) {
            setErrors({ password: data.error });
          } else if (data.code === "ACCOUNT_SUSPENDED") {
            setGlobalError("🚫 " + data.error);
          } else if (data.code === "RATE_LIMIT") {
            setGlobalError(`⏳ ${data.error}`);
          } else {
            setGlobalError(data.error);
          }
          return;
        }

        if (data.requires2FA) {
          setTwoFAChallengeToken(data.challengeToken);
          setTwoFARequired(true);
          setTwoFACode("");
          setTwoFAError(null);
          return;
        }

        await finishLogin(data, password);

      } catch (err: any) {
        console.error("❌ Error de autenticación:", err.message);
        setGlobalError(t("auth.errors.connection"));
      } finally {
        setLoading(false);
      }
    },
    [email, password, name, isLogin, validate, finishLogin, t]
  );

  // =========================================================
  // HANDLER: Verificar 2FA
  // =========================================================
  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) {
      setTwoFAError(t("auth.twoFA.enterCode"));
      return;
    }

    setTwoFALoading(true);
    setTwoFAError(null);

    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/2fa/verify-login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          challengeToken: twoFAChallengeToken,
          code:           twoFACode,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        if (data.code === "RATE_LIMIT") {
          setTwoFAError(`⏳ ${data.error}`);
        } else {
          setTwoFAError(data.error || t("auth.twoFA.incorrect"));
        }

        if (
          data.error?.includes("expirada") ||
          data.error?.includes("inválida")  ||
          data.error?.includes("expired")   ||
          data.error?.includes("invalid")
        ) {
          setTimeout(() => {
            setTwoFARequired(false);
            setTwoFACode("");
            setTwoFAError(null);
            setTwoFAChallengeToken("");
          }, 2000);
        }
        return;
      }

      await finishLogin(data, password);

    } catch {
      setTwoFAError(t("auth.errors.connection"));
    } finally {
      setTwoFALoading(false);
    }
  };

  // =========================================================
  // HANDLER: Reset password
  // =========================================================
  const handlePasswordReset = useCallback(async () => {
    if (
      !resetEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)
    ) {
      setGlobalError(t("auth.errors.invalidEmail"));
      return;
    }

    setResetLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setResetSent(true);
      } else if (data.code === "RATE_LIMIT") {
        setGlobalError(`⏳ ${data.error}`);
      } else {
        setGlobalError(data.error);
      }
    } catch {
      setGlobalError(t("auth.errors.connection"));
    } finally {
      setResetLoading(false);
    }
  }, [resetEmail, t]);

  // =========================================================
  // HANDLER: Switch login/registro
  // =========================================================
  const handleSwitchView = () => {
    setErrors({});
    setGlobalError(null);
    setShowReset(false);
    setResetSent(false);
    navigate(isLogin ? "register" : "login");
  };
