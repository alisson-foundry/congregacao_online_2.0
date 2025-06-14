'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

function FirebaseAuthSync() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.firebaseIdToken && !auth.currentUser) {
      const cred = GoogleAuthProvider.credential(session.firebaseIdToken as string);
      signInWithCredential(auth, cred).catch((err) => {
        console.error('Erro ao autenticar no Firebase:', err);
      });
    }
  }, [session]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirebaseAuthSync />
      {children}
    </SessionProvider>
  );
}
