'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Home, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  ShieldAlert,
  Loader2,
  Baby,
  Calendar,
  DollarSign,
  FileText,
  ClipboardList,
  MessagesSquare,
  MapPin,
  Gift
} from 'lucide-react';
import Logo from '@/components/Logo';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    // Recupera dados básicos do usuário que salvamos localmente pós-login
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const getMenuItems = (): SidebarItem[] => {
    if (!user) return [];
    if (user.role === 'DEPENDENT') {
      return [
        { name: 'Meu Dia', href: '/dashboard/child-view', icon: ClipboardList },
        { name: 'Calendário', href: '/dashboard/calendar', icon: Calendar },
      ];
    }
    return [
      { name: 'Início', href: '/dashboard', icon: Home },
      { name: 'Filhos', href: '/dashboard/children', icon: Baby },
      { name: 'Cuidadores', href: '/dashboard/users', icon: Users },
      { name: 'Residências', href: '/dashboard/residences', icon: MapPin },
      { name: 'Calendário', href: '/dashboard/calendar', icon: Calendar },
      { name: 'Tarefas', href: '/dashboard/tasks', icon: ClipboardList },
      { name: 'Reuniões', href: '/dashboard/meetings', icon: MessagesSquare },
      { name: 'Recompensas', href: '/dashboard/rewards', icon: Gift },
      { name: 'Documentos', href: '/dashboard/documents', icon: FileText },
      { name: 'Financeiro', href: '/dashboard/financeiro', icon: DollarSign },
      { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
    ];
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        localStorage.removeItem('user');
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Erro ao realizar logout:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      
      {/* Botão flutuante para abrir o menu em dispositivos móveis */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <Logo size="sm" variant="light" />
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-700 cursor-pointer"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar - Fixa em desktops, flutuante/slide no mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0
        md:static md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Topo da Sidebar (Branding) */}
        <div>
          <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
            <Logo size="sm" variant="light" />
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-slate-500 hover:text-white rounded-lg focus:outline-none cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Perfis de Permissão e Identificador do SuperAdmin */}
          <div className="px-4 py-4 border-b border-slate-800/40">
            <div className="flex items-center gap-3 p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl">
              <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Perfil Acesso</p>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                   user?.role === 'ADMIN' ? 'Responsável' : 'Dependente'}
                </p>
              </div>
            </div>
          </div>

          {/* Links de Navegação */}
          <nav className="p-4 space-y-1.5">
            {getMenuItems().map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/10' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Rodapé da Sidebar (User Info & Logout) */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/80">
          {user && (
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <UserIcon className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-950/40 hover:bg-red-950/20 border border-slate-800 hover:border-red-900/50 text-slate-400 hover:text-red-400 text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogOut className="w-4 h-4 shrink-0" />
                Sair do Sistema
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Overlay para escurecer o fundo no mobile quando a sidebar estiver aberta */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm transition-all duration-300"
        />
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
