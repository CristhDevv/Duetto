import { createClient } from "@/lib/supabase/server";
import { Plus, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inicio — Duetto",
  description: "Resumen diario de tareas y balance de puntos en tu hogar.",
};

export const dynamic = 'force-dynamic';

interface UserProfile {
  id: string;
  name: string;
  avatar_color: string;
  points: number;
  couple_id?: string;
}

interface Task {
  id: string;
  title: string;
  category: string;
  points_value: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  // Fetch current user profile
  let profile: UserProfile | null = null;
  const { data: pData, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  profile = pData;

  if (profileError && profileError.code !== 'PGRST116') {
    // Manejo de error inesperado (que no sea 'no encontrado')
  }

  // Si no existe el perfil (ej. acaba de registrarse y no hay trigger), lo creamos.
  if (!profile) {
    const newProfile = {
      id: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
      avatar_color: '#7C6AF7',
      points: 0
    };
    const { data: insertedProfile } = await supabase.from('users').insert(newProfile).select().single();
    if (insertedProfile) profile = insertedProfile as UserProfile;
    else profile = newProfile as UserProfile;
  }

  const typedProfile = profile as UserProfile;

  if (!typedProfile.couple_id) {
    redirect('/onboarding');
  }

  // Fetch partner profile si tiene pareja
  let partner: UserProfile | null = null;
  if (typedProfile.couple_id) {
    const { data, error: partnerError } = await supabase
      .from('users')
      .select('*')
      .eq('couple_id', typedProfile.couple_id)
      .neq('id', typedProfile.id)
      .maybeSingle();
    
    if (!partnerError) partner = data;
  }

  // Fetch upcoming tasks assigned to user
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to', typedProfile.id)
    .eq('is_completed', false)
    .order('created_at', { ascending: false })
    .limit(5);

  const typedTasks = (tasks || []) as Task[];

  return (
    <div className="px-4 py-6 relative min-h-full pb-24">
      <header className="mb-8 mt-2">
        <h1 className="text-3xl font-bold text-primary">Hola, {typedProfile.name} 👋</h1>
        <p className="text-secondary mt-1">Este es tu resumen del día.</p>
      </header>

      {/* Tarjeta de Balance */}
      <section className="bg-surface rounded-3xl p-5 mb-8 border border-border">
        <h2 className="text-xs font-bold text-secondary mb-4 uppercase tracking-wider">Balance de Puntos</h2>
        <div className="flex justify-between items-center px-2">
          
          <div className="flex flex-col items-center">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm"
              style={{ backgroundColor: typedProfile.avatar_color || '#7C6AF7' }}
            >
              {typedProfile.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium mt-2">{typedProfile.name}</span>
            <span className="text-2xl font-bold text-primary mt-1">{typedProfile.points || 0}</span>
          </div>

          <div className="text-border">
            <span className="text-2xl font-light">VS</span>
          </div>

          <div className="flex flex-col items-center opacity-90">
            <div 
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-sm"
              style={{ backgroundColor: partner?.avatar_color || '#EBEBEB' }}
            >
              {partner ? partner.name.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="text-sm font-medium mt-2">{partner ? partner.name : 'Pareja'}</span>
            <span className="text-2xl font-bold text-primary mt-1">{partner ? partner.points : 0}</span>
          </div>

        </div>
      </section>

      {/* Lista de Tareas */}
      <section className="mb-20">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-primary">Tus próximas tareas</h2>
        </div>
        
        {typedTasks.length === 0 ? (
          <div className="text-center py-10 px-4 bg-surface rounded-2xl border border-border border-dashed flex flex-col items-center">
            <CheckCircle2 className="w-10 h-10 text-border mb-3" />
            <p className="text-secondary text-sm">No tienes tareas pendientes. ¡Buen trabajo!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {typedTasks.map((task) => (
              <div key={task.id} className="flex items-center p-4 bg-white border border-border rounded-2xl shadow-sm">
                <button className="w-6 h-6 rounded-full border-2 border-border mr-4 flex-shrink-0 hover:border-accent transition-colors" />
                <div className="flex-1">
                  <h3 className="font-semibold text-primary text-sm">{task.title}</h3>
                  <div className="flex items-center mt-1">
                    <span className="bg-accent-light text-accent text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {task.category}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-bold text-success ml-2">
                  +{task.points_value}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAB (Floating Action Button) alineado al ancho del layout */}
      <div className="fixed bottom-20 w-full max-w-md pointer-events-none flex justify-end px-4 z-40">
        <Link 
          href="/dashboard/tasks?new=true" 
          className="pointer-events-auto w-14 h-14 bg-accent text-white rounded-full flex items-center justify-center shadow hover:bg-[#6855e0] transition-transform hover:scale-105"
        >
          <Plus className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
