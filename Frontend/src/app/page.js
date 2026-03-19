'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isSessaoValida } from '../shared/auth/session';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isSessaoValida()) {
      router.replace('/atendimentos');
      return;
    }

    router.replace('/login');
  }, [router]);

  return null;
}
