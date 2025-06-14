import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    isAdmin?: boolean;
    firebaseIdToken?: string;
  }

  interface User {
    isAdmin?: boolean;
  }
}
