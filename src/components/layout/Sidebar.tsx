'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Calendar, 
  Settings, 
  Home,
  ListChecks
} from 'lucide-react';

const menuItems = [
  {
    title: 'Início',
    href: '/',
    icon: Home
  },
  {
    title: 'Gerenciar Membros',
    href: '/congregacao/membros',
    icon: Users
  },
  {
    title: 'Gerar Designações',
    href: '/congregacao/designacoes',
    icon: ListChecks
  },
  {
    title: 'Configurações',
    href: '/configuracoes',
    icon: Settings
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#2B3A67] border-r border-[#2B3A67]">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white">Congregação Online</h2>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-[#4A5B8C] text-white'
                  : 'text-white hover:bg-[#4A5B8C]'
              )}
            >
              <item.icon className="w-5 h-5 mr-3 text-white" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 
