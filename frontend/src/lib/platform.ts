export type Plataforma = 'MOBILE' | 'DESKTOP';

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

export function detectPlataforma(): Plataforma {
  if (typeof window === 'undefined') return 'DESKTOP';

  const userAgent = navigator.userAgent || '';
  const narrowViewport = window.matchMedia?.('(max-width: 767px)').matches ?? false;

  return MOBILE_UA.test(userAgent) || narrowViewport ? 'MOBILE' : 'DESKTOP';
}
