"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "register" ? "register" : "login";
  
  const [mode, setMode] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        if (!name.trim()) {
          throw new Error("El nombre es requerido");
        }
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name,
            },
          },
        });
        if (signUpError) throw signUpError;
        
        // Supabase returns session if auto-confirm is enabled. If not, session is null.
        if (data.session) {
          router.push("/dashboard");
        } else {
          setError("Revisa tu correo electrónico para confirmar tu cuenta.");
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.session) {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error('Auth error completo:', err, JSON.stringify(err));
      const message = err instanceof Error
        ? `${err.message} | ${JSON.stringify(err)}`
        : `Error desconocido: ${JSON.stringify(err)}`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Tabs */}
      <div className="flex bg-surface p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => { setMode("login"); setError(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors duration-150 ${
            mode === "login" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
          }`}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => { setMode("register"); setError(null); }}
          className={`flex-1 py-2 text-sm font-medium rounded-xl transition-colors duration-150 ${
            mode === "register" ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
          }`}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-secondary ml-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:border-accent transition-colors duration-150"
              placeholder="Tu nombre"
              required={mode === "register"}
            />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-sm font-medium text-secondary ml-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:border-accent transition-colors duration-150"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-secondary ml-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-border rounded-2xl focus:outline-none focus:border-accent transition-colors duration-150"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 mt-2 bg-accent text-white rounded-2xl font-medium transition-colors duration-150 hover:bg-[#6855e0] disabled:opacity-70 flex justify-center items-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Entrar" : "Registrarse"}
        </button>

        {error && (
          <p className="text-danger text-sm text-center mt-2 font-medium">{error}</p>
        )}
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-primary">
      <div className="flex flex-col items-center w-full mb-8">
        <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-4">
          <circle cx="35" cy="50" r="25" stroke="#7C6AF7" strokeWidth="8" />
          <circle cx="65" cy="50" r="25" stroke="#7C6AF7" strokeWidth="8" />
        </svg>
        <h1 className="text-2xl font-bold">Duetto</h1>
      </div>
      <Suspense fallback={<div className="w-full flex justify-center py-8"><Loader2 className="animate-spin text-accent" /></div>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
