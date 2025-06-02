import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar'; // Import the Sidebar component

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <main className="flex-1 p-6 bg-gray-100">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
