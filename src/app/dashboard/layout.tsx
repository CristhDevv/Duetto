import BottomNav from "./BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex justify-center min-h-screen bg-surface">
      {/* Contenedor principal mobile-first centrado de max 448px */}
      <div className="w-full max-w-md bg-white min-h-screen relative flex flex-col shadow-sm">
        {/* Padding bottom de 16 (4rem = 64px) para no quedar tapado por el BottomNav que mide h-16 */}
        <main className="flex-1 pb-16">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
