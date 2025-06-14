'use client';

import { useEffect, useState } from 'react';
import {
  carregarAdminPassword,
  salvarAdminPassword,
  carregarAdminPasswordFirestore,
  salvarAdminPasswordFirestore,
  carregarAdminAutenticado,
  salvarAdminAutenticado,
} from '@/lib/congregacao/storage';

export function useAdminAuth() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(carregarAdminAutenticado());
  }, []);

  const checkPassword = async (pwd: string): Promise<boolean> => {
    const stored = await carregarAdminPasswordFirestore();
    const ok = stored !== null && pwd === stored;
    if (ok) {
      salvarAdminAutenticado(true);
      setAuthenticated(true);
    }
    return ok;
  };

  const setPassword = async (pwd: string) => {
    await salvarAdminPasswordFirestore(pwd);
    salvarAdminPassword(pwd);
    salvarAdminAutenticado(true);
    setAuthenticated(true);
  };

  const logout = () => {
    salvarAdminAutenticado(false);
    setAuthenticated(false);
  };

  return { authenticated, checkPassword, setPassword, logout };
}
