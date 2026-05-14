import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-primary">
      <div className="flex flex-col items-center max-w-sm w-full space-y-8">
        
        {/* Logo */}
        <div className="flex justify-center items-center">
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="35" cy="50" r="25" stroke="#7C6AF7" strokeWidth="8" />
            <circle cx="65" cy="50" r="25" stroke="#7C6AF7" strokeWidth="8" />
          </svg>
        </div>

        {/* Title & Tagline */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Duetto</h1>
          <p className="text-secondary text-lg">El hogar en armonía</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col w-full space-y-3 pt-4">
          <Link href="/auth?tab=login" className="w-full">
            <button className="w-full py-3.5 px-4 bg-accent text-white rounded-2xl font-medium transition-colors duration-150 hover:bg-[#6855e0]">
              Iniciar sesión
            </button>
          </Link>
          <Link href="/auth?tab=register" className="w-full">
            <button className="w-full py-3.5 px-4 bg-accent-light text-accent rounded-2xl font-medium transition-colors duration-150 hover:bg-[#e4dfff]">
              Crear cuenta
            </button>
          </Link>
        </div>

      </div>
    </main>
  );
}
