/**
 * Logo — Renovafacil monograma.
 * "R" sólido sobre una cuadrícula 3D sutil (evoca placas decorativas).
 * Solo usa `currentColor` — el color se hereda del contenedor vía `text-*`.
 */

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 36, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Renovafacil"
      role="img"
      className={className}
    >
      {/* Cuadrícula 3D decorativa — profundidades crecientes */}
      <rect x="22" y="3"  width="7" height="7" rx="1.2" fill="currentColor" opacity="0.14" />
      <rect x="30" y="3"  width="7" height="7" rx="1.2" fill="currentColor" opacity="0.08" />
      <rect x="30" y="11" width="7" height="7" rx="1.2" fill="currentColor" opacity="0.14" />

      {/* Monograma R — rendered como path sólido para crispness */}
      {/*  Anatomía:
           stem vertical (ancho 6, alto 24)
           bowl superior con curva suave
           leg diagonal limpia                                          */}
      <path
        d="M5 7
           H20
           C24.5 7 28 10.2 28 14.5
           C28 18.1 25.5 21.0 22.0 21.8
           L28.5 33
           H22.8
           L16.8 22.5
           H11 V33 H5 Z
           M11 12.2 V17.8 H19.3
           C21.3 17.8 22.5 16.5 22.5 14.5
           C22.5 12.8 21.3 12.2 19.3 12.2 Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}
