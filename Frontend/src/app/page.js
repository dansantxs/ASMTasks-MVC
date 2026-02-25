'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSessionValid } from '../shared/auth/session';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isSessionValid()) {
      router.replace('/atendimentos/agenda');
      return;
    }

    router.replace('/login');
  }, [router]);

  return null;
}
