import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { MOCK_BALANCES, MOCK_NOTIFICATIONS } from "@/data/mock";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";

// Conexión real con Firebase
import { auth, db } from "@/lib/firebase/config";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { User as AppUser } from "@/types";

export function AuthPage() {
  const { currentView, navigate } = useAppStore();
  const isLogin = currentView === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = "Correo requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Correo inválido";
    if (!password) newErrors.password = "Contraseña requerida";
    else if (password.length < 6)
      newErrors.password = "Mínimo 6 caracteres";
    if (!isLogin && !name.trim()) newErrors.name = "Nombre requerido";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, name, isLogin]);

  // Manejador para Correo y Contraseña
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      setErrors({});

      try {
        if (isLogin) {
          // Firebase Auth valida las credenciales. El guardián de App.tsx iniciará la sesión globalmente
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          // Flujo de Registro Real
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const fUser = userCredential.user;

          await updateProfile(fUser, { displayName: name });

          const loggedUser: AppUser = {
            uid: fUser.uid,
            email: email,
            displayName: name,
            photoURL: null,
            kycStatus: "unverified",
            createdAt: Date.now(),
            totalTrades: 0,
            rating: 5.0,
            walletAddress: null,
          };

          await setDoc(doc(db, "users", fUser.uid), loggedUser);
        }
      } catch (error: any) {
        console.error("Error de autenticación:", error);
        const newErrors: Record<string, string> = {};
        
        if (
          error.code === "auth/user-not-found" || 
          error.code === "auth/wrong-password" || 
          error.code === "auth/invalid-credential"
        ) {
          newErrors.email = "Credenciales incorrectas";
        } else if (error.code === "auth/email-already-in-use") {
          newErrors.email = "El correo ya está registrado";
        } else {
          newErrors.email = "Error en el servidor. Inténtalo de nuevo.";
        }
        setErrors(newErrors);
        setLoading(false); // Solo apagamos el loader si hay un error para evitar parpadeos
      }
    },
    [email, password, name, isLogin, validate]
  );

  // Manejador para Autenticación con Google
  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    setErrors({});
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const fUser = result.user;

      const userDocRef = doc(db, "users", fUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        const loggedUser: AppUser = {
          uid: fUser.uid,
          email: fUser.email || "",
          displayName: fUser.displayName || "Usuario de Google",
          photoURL: fUser.photoURL || null,
          kycStatus: "unverified",
          createdAt: Date.now(),
          totalTrades: 0,
          rating: 5.0,
          walletAddress: null,
        };
        await setDoc(userDocRef, loggedUser);
      }
    } catch (error: any) {
      console.error("Error con Google Auth:", error);
      setErrors({ email: "Error al conectar con Google" });
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-navy-950 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate("landing")}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full px-6 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-500/20">
            <span className="text-white font-black text-xl">CX</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isLogin ? "Bienvenido de vuelta" : "Crear cuenta"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isLogin ? "Inicia sesión para acceder a tu cuenta" : "Regístrate para empezar a operar"}
          </p>
        </div>

        {/* Google Button */}
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={handleGoogleLogin}
          loading={loading}
          className="mb-6"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="ml-2">Continuar con Google</span>
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">o con correo</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              label="Nombre completo"
              placeholder="Tu nombre"
              icon={<User className="h-4 w-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
          )}

          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@correo.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Contraseña"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            icon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete={isLogin ? "current-password" : "new-password"}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          {isLogin && (
            <div className="text-right">
              <button type="button" className="text-xs text-brand-500 hover:text-brand-600 font-medium">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
        </form>

        {/* Switch */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            onClick={() => navigate(isLogin ? "register" : "login")}
            className="text-brand-500 hover:text-brand-600 font-semibold"
          >
            {isLogin ? "Regístrate" : "Inicia sesión"}
          </button>
        </p>
      </div>
    </div>
  );
        }
            
