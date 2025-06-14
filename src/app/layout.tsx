import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar'; // Import the Sidebar component
import { Providers } from "./providers"
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

// Removed Geist Mono as it's not explicitly requested and Geist Sans can cover needs.
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'Congregação Online',
  description: 'Gerencie designações e membros da congregação online.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session as any)?.isAdmin;

  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="flex min-h-screen">
            {session && <Sidebar isAdmin={isAdmin} />}
            <main className={`flex-1 p-6 bg-gray-100 ${!session ? 'w-full' : ''}`}>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
