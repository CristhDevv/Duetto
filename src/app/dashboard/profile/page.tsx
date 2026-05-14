"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Copy, LogOut, Check, Edit2, X, Award, Star, Zap, Crown } from "lucide-react";
import { useGlobalData } from "@/context/GlobalDataContext";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const { currentUser: profile, loading, refreshData } = useGlobalData();

  const [inviteCode, setInviteCode] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditNameValue(profile.name);
      if (profile.couple_id) {
        supabase.from('couples').select('invite_code').eq('id', profile.couple_id).single()
          .then(({ data }) => {
            if (data) setInviteCode(data.invite_code);
          });
      }
    }
  }, [profile, supabase]);

  const handleSaveName = async () => {
    if (!profile || !editNameValue.trim() || editNameValue === profile.name) {
      setIsEditingName(false);
      if (profile) setEditNameValue(profile.name);
      return;
    }
    
    setSavingName(true);
    const newName = editNameValue.trim();
    const { error } = await supabase.from('users').update({ name: newName }).eq('id', profile.id);
    
    if (!error) {
      await refreshData();
    }
    setSavingName(false);
    setIsEditingName(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return <div className="min-h-full flex justify-center items-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  }

  const badges = [
    { id: 'aprendiz', name: 'Aprendiz', min: 0, max: 99, icon: Award, desc: 'Comenzando a organizar el hogar', color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'colaborador', name: 'Colaborador', min: 100, max: 299, icon: Star, desc: 'Aportando consistencia al equipo', color: 'text-green-500', bg: 'bg-green-100' },
    { id: 'experto', name: 'Experto', min: 300, max: 599, icon: Zap, desc: 'Dominando las tareas diarias', color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'maestro', name: 'Maestro', min: 600, max: Infinity, icon: Crown, desc: 'Leyenda absoluta del hogar', color: 'text-yellow-500', bg: 'bg-yellow-100' },
  ];

  const userPoints = profile?.points || 0;

  return (
    <div className="px-4 py-6 relative min-h-full pb-24">
      <header className="mb-8 mt-2">
        <h1 className="text-3xl font-bold text-primary">Tu Perfil</h1>
      </header>

      {/* Avatar & Name Section */}
      <section className="flex flex-col items-center mb-10">
        <div 
          className="w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-6"
          style={{ backgroundColor: profile?.avatar_color || '#7C6AF7' }}
        >
          {profile?.name?.charAt(0).toUpperCase()}
        </div>

        {isEditingName ? (
          <div className="flex items-center space-x-2 w-full max-w-xs">
            <input 
              type="text" 
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              className="flex-1 px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:border-accent text-center font-bold text-lg"
              autoFocus
            />
            <button onClick={handleSaveName} disabled={savingName} className="p-2 bg-success text-white rounded-xl shadow-sm hover:opacity-90">
              {savingName ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            </button>
            <button onClick={() => { setIsEditingName(false); if (profile) setEditNameValue(profile.name); }} className="p-2 bg-surface text-secondary rounded-xl hover:text-primary border border-border">
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center group cursor-pointer" onClick={() => setIsEditingName(true)}>
            <h2 className="text-2xl font-bold text-primary">{profile?.name}</h2>
            <Edit2 className="w-4 h-4 ml-2 text-secondary opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        <p className="text-secondary mt-2 font-medium">{userPoints} puntos acumulados</p>
      </section>

      {/* Mi Hogar Section */}
      <section className="mb-10">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-3">Mi Hogar</h3>
        <div className="bg-surface rounded-3xl p-5 border border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-secondary mb-1">Código de invitación</p>
            <p className="text-2xl font-black tracking-[0.15em] text-primary">{inviteCode}</p>
          </div>
          <button 
            onClick={copyToClipboard}
            className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-2xl shadow-sm border border-border text-accent hover:border-accent transition-colors"
            title="Copiar código"
          >
            {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-secondary mt-3 text-center px-4">
          Comparte este código con tu pareja para que pueda unirse a tu hogar.
        </p>
      </section>

      {/* Logros Section */}
      <section className="mb-10">
        <h3 className="text-sm font-bold text-secondary uppercase tracking-wider mb-3">Tus Logros</h3>
        <div className="space-y-3">
          {badges.map((badge) => {
            const isUnlocked = userPoints >= badge.min;
            const Icon = badge.icon;
            
            return (
              <div 
                key={badge.id} 
                className={`flex items-center p-4 rounded-2xl border transition-all ${
                  isUnlocked ? "bg-white border-border shadow-sm" : "bg-surface border-transparent opacity-50 grayscale"
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mr-4 ${isUnlocked ? badge.bg : 'bg-gray-200'}`}>
                  <Icon className={`w-6 h-6 ${isUnlocked ? badge.color : 'text-gray-400'}`} />
                </div>
                <div>
                  <div className="flex items-center">
                    <h4 className="font-bold text-primary">{badge.name}</h4>
                    {isUnlocked && <span className="ml-2 text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-bold uppercase">Desbloqueado</span>}
                  </div>
                  <p className="text-xs text-secondary mt-1">{badge.desc}</p>
                  <p className="text-[10px] text-secondary/60 mt-1">{badge.min === 0 ? "Por defecto" : `${badge.min} puntos requeridos`}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Logout Button */}
      <section className="mt-8">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center py-4 rounded-2xl bg-danger/10 text-danger font-bold hover:bg-danger/20 transition-colors"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar sesión
        </button>
      </section>
    </div>
  );
}
