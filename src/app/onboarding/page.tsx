"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Copy, Loader2, Home, Users } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState<"choose" | "create" | "join" | "success">("choose");
  const [inviteCode, setInviteCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error: authError }) => {
      if (authError) {
        router.push("/auth");
        return;
      }
      if (user) setUserId(user.id);
      else router.push("/auth");
    });
  }, [supabase, router]);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateHome = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const code = generateCode();
      
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .insert({ invite_code: code })
        .select()
        .single();
        
      if (coupleError) throw coupleError;

      // TAREA 11 — Categorías por defecto
      const defaultCategories = [
        { couple_id: couple.id, name: 'Cocina', icon: 'UtensilsCrossed', color: '#FF6B6B' },
        { couple_id: couple.id, name: 'Limpieza', icon: 'Sparkles', color: '#7C6AF7' },
        { couple_id: couple.id, name: 'Compras', icon: 'ShoppingCart', color: '#2DD4A7' },
        { couple_id: couple.id, name: 'Mascotas', icon: 'Heart', color: '#FFB347' },
        { couple_id: couple.id, name: 'Lavandería', icon: 'Wind', color: '#74B9FF' },
        { couple_id: couple.id, name: 'Exterior', icon: 'Trees', color: '#55EFC4' },
      ];

      const { error: categoriesError } = await supabase
        .from('categories')
        .insert(defaultCategories);

      if (categoriesError) throw categoriesError;

      const { error: userError } = await supabase
        .from('users')
        .update({ couple_id: couple.id })
        .eq('id', userId);
        
      if (userError) throw userError;

      setInviteCode(code);
      setStep("success");
    } catch {
      setError("Error al crear el hogar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinHome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !inputCode.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data: couple, error: findError } = await supabase
        .from('couples')
        .select('*')
        .eq('invite_code', inputCode.toUpperCase().trim())
        .single();
        
      if (findError || !couple) {
        throw new Error("Código de invitación inválido");
      }

      const { error: userError } = await supabase
        .from('users')
        .update({ couple_id: couple.id })
        .eq('id', userId);
        
      if (userError) throw userError;

      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al unirse al hogar";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center px-4 py-12 text-primary">
      {/* Small Logo */}
      <div className="flex flex-col items-center mb-12">
        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="50" r="25" stroke="#7C6AF7" strokeWidth="8" />
          <circle cx="65" cy="50" r="25" stroke="#7C6AF7" strokeWidth="8" />
        </svg>
      </div>

      <div className="w-full max-w-sm flex-1 flex flex-col">
        {step === "choose" && (
          <div className="flex flex-col space-y-6">
            <h1 className="text-2xl font-bold text-center mb-4">Configura tu hogar</h1>
            
            <button 
              onClick={handleCreateHome}
              disabled={loading}
              className="group flex flex-col items-center justify-center p-8 bg-surface border border-border rounded-3xl transition-all duration-200 hover:border-accent hover:bg-accent-light"
            >
              {loading ? (
                <Loader2 className="w-10 h-10 animate-spin text-accent mb-4" />
              ) : (
                <Home className="w-10 h-10 text-accent mb-4 transition-transform group-hover:scale-110" />
              )}
              <h2 className="text-lg font-bold">Crear un nuevo hogar</h2>
              <p className="text-sm text-secondary text-center mt-2">Serás el primero y podrás invitar a tu pareja.</p>
            </button>

            <button 
              onClick={() => setStep("join")}
              disabled={loading}
              className="group flex flex-col items-center justify-center p-8 bg-surface border border-border rounded-3xl transition-all duration-200 hover:border-accent hover:bg-accent-light"
            >
              <Users className="w-10 h-10 text-secondary mb-4 transition-transform group-hover:scale-110 group-hover:text-accent" />
              <h2 className="text-lg font-bold">Unirme a un hogar</h2>
              <p className="text-sm text-secondary text-center mt-2">Usa el código de invitación que te compartió tu pareja.</p>
            </button>

            {error && <p className="text-danger text-center text-sm font-medium">{error}</p>}
          </div>
        )}

        {step === "join" && (
          <div className="flex flex-col space-y-6 w-full mt-8">
            <h1 className="text-2xl font-bold text-center">Unirme a un hogar</h1>
            <p className="text-center text-secondary text-sm">Ingresa el código de 6 caracteres que recibiste.</p>
            
            <form onSubmit={handleJoinHome} className="flex flex-col space-y-4 mt-4">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="X7Y9Z1"
                maxLength={6}
                className="w-full text-center text-3xl font-bold tracking-[0.25em] px-4 py-6 bg-surface border border-border rounded-3xl focus:outline-none focus:border-accent uppercase"
              />
              <button
                type="submit"
                disabled={loading || inputCode.length < 6}
                className="w-full py-4 bg-accent text-white rounded-2xl font-bold transition-colors hover:bg-[#6855e0] disabled:opacity-50 flex justify-center items-center mt-2"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Entrar al hogar"}
              </button>
            </form>

            {error && <p className="text-danger text-center text-sm font-medium">{error}</p>}

            <button onClick={() => { setStep("choose"); setError(null); setInputCode(""); }} className="text-secondary text-sm font-medium hover:text-primary mt-6">
              Volver atrás
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center space-y-6 w-full mt-8">
            <h1 className="text-2xl font-bold text-center">¡Hogar creado!</h1>
            <p className="text-center text-secondary text-sm">Comparte este código con tu pareja para que se una a tu hogar.</p>
            
            <div className="w-full bg-surface border border-border rounded-3xl p-8 flex flex-col items-center relative overflow-hidden mt-4">
              <span className="text-4xl font-bold tracking-[0.25em] text-primary">{inviteCode}</span>
              
              <button 
                onClick={copyToClipboard}
                className="mt-6 flex items-center space-x-2 text-accent font-medium hover:text-[#6855e0] transition-colors bg-accent-light px-4 py-2 rounded-xl"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? "¡Copiado al portapapeles!" : "Copiar código"}</span>
              </button>
            </div>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-4 bg-accent text-white rounded-2xl font-bold transition-colors hover:bg-[#6855e0] mt-4"
            >
              Ir a mi Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
