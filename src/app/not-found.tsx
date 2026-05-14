import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-primary">
      <div className="flex flex-col items-center mb-8">
        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="50" r="25" stroke="#7C6AF7" strokeWidth="8" />
          <circle cx="65" cy="50" r="25" stroke="#7C6AF7" strokeWidth="8" />
        </svg>
      </div>
      
      <h1 className="text-4xl font-bold mb-2">404</h1>
      <p className="text-secondary text-center mb-8">Oops, parece que este rincón del hogar no existe.</p>
      
      <Link 
        href="/dashboard" 
        className="px-8 py-4 bg-accent text-white rounded-2xl font-bold transition-colors hover:bg-[#6855e0] shadow-sm"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
