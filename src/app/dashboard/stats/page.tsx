"use client";

import { useEffect } from "react";
import { CheckCircle2, Trophy, Loader2 } from "lucide-react";
import { useGlobalData } from "@/context/GlobalDataContext";

function timeAgo(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export default function StatsPage() {
  const { currentUser: profile, partner, tasks, loading, loadPartnerTasks } = useGlobalData();

  useEffect(() => {
    if (!loading && profile) {
      loadPartnerTasks();
    }
  }, [loading, profile, loadPartnerTasks]);

  if (loading) {
    return (
      <div className="min-h-full flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const completedTasks = tasks.filter(t => t.is_completed);
  
  // Cálculos de la última semana (7 días)
  // Nota: Como UI optimista no siempre guarda la fecha local de `completed_at` en el array de React (usamos created_at por simplicidad en local si falta),
  // esto puede no ser 100% exacto en tiempo real si el objeto optimista no tiene `completed_at`, pero las tareas que vienen de Supabase sí lo tendrán.
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const tasksThisWeekProfile = completedTasks.filter((t) => t.assigned_to === profile.id).length;
  const tasksThisWeekPartner = completedTasks.filter((t) => partner && t.assigned_to === partner.id).length;

  // Cálculos para la barra de progreso de puntos
  const profilePoints = profile.points || 0;
  const partnerPoints = partner ? (partner.points || 0) : 0;
  const totalPoints = profilePoints + partnerPoints;
  const profilePercent = totalPoints > 0 ? (profilePoints / totalPoints) * 100 : 50;
  const partnerPercent = totalPoints > 0 ? (partnerPoints / totalPoints) * 100 : 50;

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const formattedToday = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <div className="px-4 py-6 relative min-h-full pb-24">
      {/* Header */}
      <header className="mb-8 mt-2">
        <h1 className="text-3xl font-bold text-primary">Estadísticas</h1>
        <p className="text-secondary mt-1 capitalize">{formattedToday}</p>
      </header>

      {/* Balance de Puntos (Visual Progress) */}
      <section className="bg-surface rounded-3xl p-6 mb-6 border border-border shadow-sm">
        <div className="flex items-center mb-6">
          <Trophy className="w-5 h-5 text-accent mr-2" />
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Liderazgo global</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Yo */}
          <div className="flex flex-col items-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md"
              style={{ backgroundColor: profile.avatar_color || '#7C6AF7' }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-primary mt-3">{profile.name}</span>
            <span className="text-3xl font-black text-accent mt-1">{profilePoints}</span>
            <span className="text-xs text-secondary font-medium">puntos</span>
          </div>

          {/* Pareja */}
          <div className="flex flex-col items-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md"
              style={{ backgroundColor: partner?.avatar_color || '#EBEBEB' }}
            >
              {partner ? partner.name.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="text-sm font-bold text-primary mt-3">{partner ? partner.name : 'Pareja'}</span>
            <span className="text-3xl font-black text-secondary mt-1">{partnerPoints}</span>
            <span className="text-xs text-secondary font-medium">puntos</span>
          </div>
        </div>

        {/* Progress Bar (Div y CSS Puro) */}
        <div className="w-full h-3 bg-gray-200 rounded-full flex overflow-hidden">
          <div 
            className="h-full transition-all duration-1000 ease-out" 
            style={{ width: `${profilePercent}%`, backgroundColor: profile.avatar_color || '#7C6AF7' }}
          />
          <div 
            className="h-full transition-all duration-1000 ease-out" 
            style={{ width: `${partnerPercent}%`, backgroundColor: partner?.avatar_color || '#cccccc' }}
          />
        </div>
      </section>

      {/* Tareas de la semana */}
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-border rounded-3xl p-5 shadow-sm">
          <h3 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Tus tareas (7 días)</h3>
          <div className="flex items-baseline">
            <span className="text-4xl font-black text-primary">{tasksThisWeekProfile}</span>
            <span className="text-xs text-secondary font-medium ml-2">completadas</span>
          </div>
        </div>
        <div className="bg-white border border-border rounded-3xl p-5 shadow-sm">
          <h3 className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Su esfuerzo (7 días)</h3>
          <div className="flex items-baseline">
            <span className="text-4xl font-black text-primary">{tasksThisWeekPartner}</span>
            <span className="text-xs text-secondary font-medium ml-2">completadas</span>
          </div>
        </div>
      </section>

      {/* Historial Reciente */}
      <section>
        <h2 className="text-lg font-bold text-primary mb-4">Últimas tareas completadas</h2>
        
        {completedTasks.length === 0 ? (
          <div className="text-center py-10 bg-surface rounded-2xl border border-border border-dashed">
            <p className="text-secondary text-sm">Aún no hay tareas completadas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedTasks.slice(0, 5).map((task) => {
              const isMine = task.assigned_to === profile.id;
              const assigneeName = isMine ? "Tú" : (partner?.name || "Pareja");
              const avatarColor = isMine ? (profile.avatar_color || '#7C6AF7') : (partner?.avatar_color || '#ccc');
              const initial = isMine ? profile.name.charAt(0).toUpperCase() : (partner?.name.charAt(0).toUpperCase() || '?');

              return (
                <div key={task.id} className="flex items-center p-4 bg-white border border-border rounded-2xl shadow-sm">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mr-4"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initial}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary text-sm truncate">{task.title}</h3>
                    <div className="flex items-center mt-1 text-xs text-secondary">
                      <span className="font-bold mr-2 text-primary">{assigneeName}</span>
                      <span>•</span>
                      <span className="ml-2 font-medium">{timeAgo(task.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <CheckCircle2 className="w-5 h-5 text-success mb-1" />
                    <span className="text-[10px] font-bold text-success">+{task.points_value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
