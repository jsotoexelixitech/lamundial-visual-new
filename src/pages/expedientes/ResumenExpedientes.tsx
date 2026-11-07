import { useEffect, useState } from 'react';
import { obtenerIndicadores, type FiltrosIndicadores, type Indicadores } from '@/lib/expedientes-api';
import { numero } from './expedientes-format';

const CIFRAS: { key: keyof Indicadores; label: string }[] = [
  { key: 'total', label: 'Total' },
  { key: 'completos', label: 'Completos' },
  { key: 'incompletos', label: 'Incompletos' },
  { key: 'sinInformacion', label: 'Sin información' },
  { key: 'pendientesPago', label: 'Pendientes de pago' },
  { key: 'porValidar', label: 'Por validar' },
  { key: 'validadosIa', label: 'Validados por IA' },
  { key: 'conErrores', label: 'Con errores' },
  { key: 'analizando', label: 'Analizando' },
];

/**
 * Resumen compacto del encabezado, visible en todas las pestañas.
 * Respeta los filtros globales (fecha y área) si la página los pasa; sin filtros es el acumulado
 * de las áreas en alcance. Si Nexus no responde, no se muestra (cada pestaña informa el error).
 */
export function ResumenExpedientes({
  recargaKey,
  filtros = {},
}: {
  recargaKey: number;
  filtros?: FiltrosIndicadores;
}) {
  const [datos, setDatos] = useState<Indicadores | null>(null);
  const [fallo, setFallo] = useState(false);
  const { area, desde, hasta } = filtros;
  // Cargando = la última respuesta no corresponde a los filtros/recarga actuales.
  const clave = `${area ?? ''}|${desde ?? ''}|${hasta ?? ''}|${recargaKey}`;
  const [listo, setListo] = useState<string | null>(null);
  const cargando = listo !== clave;

  useEffect(() => {
    let vigente = true;
    obtenerIndicadores({ area, desde, hasta })
      .then((d) => {
        if (!vigente) return;
        setDatos(d);
        setFallo(false);
      })
      .catch(() => {
        if (vigente) setFallo(true);
      })
      .finally(() => {
        if (vigente) setListo(clave);
      });
    return () => {
      vigente = false;
    };
  }, [area, desde, hasta, clave]);

  if (fallo && !datos) return null;

  const filtrado = !!(area || desde || hasta);
  return (
    <section className="mx-resumen" aria-label="Resumen de expedientes" aria-busy={cargando}>
      <dl className={`mx-resumen-grid ${cargando && datos ? 'opacity-70' : ''}`}>
        {CIFRAS.map(({ key, label }) => (
          <div key={key} className="mx-resumen-item">
            <dt>{label}</dt>
            <dd className="mx-num">{datos ? numero(datos[key]) : '…'}</dd>
          </div>
        ))}
      </dl>
      <p className="mx-resumen-nota">
        {filtrado ? 'Según los filtros de fecha y área.' : 'Acumulado de las pólizas en el monitor.'}
      </p>
    </section>
  );
}
