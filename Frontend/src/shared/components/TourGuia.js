'use client';
import { useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import 'driver.js/dist/driver.css';

export default function TourGuia({ passos = [], aoIniciar }) {
  const iniciarTour = useCallback(() => {
    import('driver.js').then(({ driver }) => {
      const tour = driver({
        showProgress: true,
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Próximo →',
        prevBtnText: '← Anterior',
        doneBtnText: '✓ Concluir',
        overlayOpacity: 0.6,
        smoothScroll: true,
        steps: passos.filter(p => !p.element || document.querySelector(p.element)),
      });
      tour.drive();
    });
  }, [passos]);

  return (
    <button
      onClick={aoIniciar ?? iniciarTour}
      title="Ajuda — como usar esta tela"
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-brand-blue/40 text-brand-blue hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all duration-200 cursor-pointer"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}
