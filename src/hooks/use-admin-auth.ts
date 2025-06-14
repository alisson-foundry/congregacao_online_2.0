'use client';

import { useEffect, useState } from 'react';
import {
  carregarAdminPassword,
  salvarAdminPassword,
  carregarAdminAutenticado,
  salvarAdminAutenticado,
} from '@/lib/congregacao/storage';

export function useAdminAuth() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(carregarAdminAutenticado());
  }, []);

  const checkPassword = (pwd: string): boolean => {
    const stored = carregarAdminPassword();
    const ok = stored !== null && pwd === stored;
    if (ok) {
      salvarAdminAutenticado(true);
      setAuthenticated(true);
    }
    return ok;
  };

  const setPassword = (pwd: string) => {
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
