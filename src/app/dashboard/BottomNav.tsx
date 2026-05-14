"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CheckSquare, BarChart2, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inicio', href: '/dashboard', icon: Home },
    { name: 'Tareas', href: '/dashboard/tasks', icon: CheckSquare },
    { name: 'Estadísticas', href: '/dashboard/stats', icon: BarChart2 },
    { name: 'Perfil', href: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-white border-t border-border h-16 flex pointer-events-auto shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <nav className="flex w-full justify-around items-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-150 ${
                  isActive ? 'text-accent' : 'text-secondary hover:text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
