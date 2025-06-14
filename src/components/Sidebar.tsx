'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Sidebar() {
  return (
    <div className="w-64 bg-blue-900 text-white min-h-screen p-4">
      <div className="text-2xl font-bold mb-6">
        Congregação Online
      </div>
      <nav>
        <ul>
          <li className="mb-2">
            <Link href="/" className="block py-2 px-4 rounded hover:bg-blue-700">
              Dashboard
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/congregacao/membros" className="block py-2 px-4 rounded hover:bg-blue-700">
              Gerenciar Membros
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/congregacao/designacoes" className="block py-2 px-4 rounded hover:bg-blue-700">
              Gerar Designações
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/configuracoes" className="block py-2 px-4 rounded hover:bg-blue-700">
              Configurações
            </Link>
          </li>
          <li className="mt-8">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Sair
            </Button>
          </li>
        </ul>
      </nav>
    </div>
  );
} 
