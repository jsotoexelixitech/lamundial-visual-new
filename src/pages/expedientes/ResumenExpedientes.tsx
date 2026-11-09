import { useEffect, useId, useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  obtenerIndicadores,
  type CategoriaIncompleto,
  type FiltrosIndicadores,
  type Indicadores,
} from '@/lib/expedientes-api';
import { categoriasVisibles, lineaSumaIncompletos, numero } from './expedientes-format';

/** Sobre la banda oscura solo se pinta lo que pide atención, y solo si la cifra es mayor que cero. */
const TONO_BANDA: Partial<Record<CategoriaIncompleto, 'rojo' | 'violeta'>> = {
  conErrores: 'rojo',
  datosCambiados: 'violeta',
};

/** Hacia abajo: nunca 100 % si falta alguna póliza. */
const pctCompletos = (d: Indicadores) =>
  d.total > 0 ? Math.floor((d.completos / d.total) * 100) : 0;

const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/**
 * Cuadre con Nexus: cuántas de las emisiones registradas están en el monitor y por qué falta
 * el resto. Sin el dato de Nexus (versión anterior) no se muestra.
 */
function textoCuadre(d: Indicadores): string | null {
  if (d.emisionesNexus == null) return null;
  const descartadas = d.descartadas ?? 0;
  const partes = [
    `${numero(d.total)} en el monitor de ${numero(d.emisionesNexus)} ${plural(
      d.emisionesNexus,
      'póliza registrada',
      'pólizas registradas',
    )} en Nexus.`,
  ];
  if (descartadas > 0) {
    partes.push(
      `${numero(descartadas)} ${plural(
        descartadas,
        'no se controla porque no pasó',
        'no se controlan porque no pasaron',
      )} por el OCR.`,
    );
  }
  const resto = d.emisionesNexus - d.total - descartadas;
  if (resto > 0) {
    partes.push(
      `${numero(resto)} ${plural(resto, 'queda', 'quedan')} fuera por el alcance configurado o por conciliar.`,
    );
  }
  return partes.join(' ');
}

/** Una cifra con su descripción siempre visible. */
function Cifra({
  label,
  valor,
  desc,
  className = '',
  children,
}: {
  label: string;
  valor: number | null;
  desc: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <dl className={`mx-resumen-item ${className}`}>
      <dt>{label}</dt>
      <dd className="mx-num">{valor === null ? '…' : numero(valor)}</dd>
      <dd className="mx-resumen-desc">{desc}</dd>
      {children}
    </dl>
  );
}

/**
 * Resumen compacto del encabezado, visible en todas las pestañas. Se lee como una suma:
 * Total = Completos + Incompletos, y los incompletos por motivo (cada póliza en uno solo, según
 * el desglose de Nexus). El pago va aparte: es otra dimensión y no suma con lo documental.
 * Respeta los filtros globales (fecha y área) si la página los pasa; sin filtros es el acumulado
 * de las áreas en alcance. Si Nexus no responde, no se muestra (cada pestaña informa el error).
 * En el móvil se ven la suma principal y la línea de motivos; «Ver todo el resumen» abre las
 * tarjetas de cada motivo y el pago.
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
  const [abierto, setAbierto] = useState(false);
  const gridId = useId();
  const pagoId = useId();
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
  // Las emisiones de Nexus no tienen área: el cuadre solo se muestra sin filtro de área.
  const cuadre = datos && !area ? textoCuadre(datos) : null;
  const valor = (k: 'total' | 'completos' | 'incompletos' | 'pendientesPago') =>
    datos ? datos[k] : null;
  // Mientras carga se muestran los motivos de siempre; si Nexus aún no manda el desglose, no.
  const desglose = datos ? datos.desglose : null;
  const verDesglose = !datos || !!desglose;
  const categorias = categoriasVisibles(desglose, datos?.validacion);
  // «Validados por IA» es parte de los completos (en validación manual, solo si hay alguno).
  const verIa = !!datos && (datos.validacion !== 'manual' || datos.validadosIa > 0);
  const atenuado = cargando && datos ? 'is-cargando' : '';
  const incompletos = datos?.incompletos ?? 0;

  return (
    <section
      className={`mx-resumen ${abierto ? 'is-abierto' : ''}`}
      aria-label="Resumen de expedientes"
      aria-busy={cargando}
    >
      {datos && (
        <div className={`mx-resumen-avance ${atenuado}`}>
          <div className="mx-resumen-avance-fila">
            <span>
              Expedientes completos:{' '}
              <strong className="mx-num">
                {numero(datos.completos)} de {numero(datos.total)}
              </strong>
            </span>
            <span className="mx-num">{pctCompletos(datos)} %</span>
          </div>
          <div
            className="mx-bar"
            role="progressbar"
            aria-valuenow={pctCompletos(datos)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Porcentaje de pólizas con expediente completo"
          >
            <div style={{ width: `${pctCompletos(datos)}%` }} />
          </div>
        </div>
      )}

      <div className={`mx-resumen-cuerpo ${atenuado}`}>
        {/* Total = Completos + Incompletos */}
        <div className="mx-resumen-ecuacion">
          <Cifra
            label="Total"
            valor={valor('total')}
            desc="Pólizas emitidas por el Marketplace que pasaron por el OCR."
            className="mx-resumen-ec-total"
          />
          <span className="mx-resumen-op mx-resumen-ec-igual">=</span>
          <Cifra
            label="Completos"
            valor={valor('completos')}
            desc="Todos los documentos requeridos están validados."
            className="mx-resumen-ec-comp"
          >
            {datos && verIa && (
              <dd className="mx-resumen-sub">
                De ellos, <span className="mx-num">{numero(datos.validadosIa)}</span>{' '}
                {plural(datos.validadosIa, 'validado', 'validados')} por IA.
              </dd>
            )}
          </Cifra>
          <span className="mx-resumen-op mx-resumen-ec-mas">+</span>
          <Cifra
            label="Incompletos"
            valor={valor('incompletos')}
            desc="Les falta al menos un documento por recibir, validar o corregir."
            className={`mx-resumen-ec-incomp ${incompletos > 0 ? 'is-ambar' : ''}`}
          />
        </div>

        {/* Incompletos = suma de los motivos (cada póliza en uno solo) */}
        {verDesglose && (
          <div className="mx-resumen-desglose">
            <p className="mx-resumen-grupo-tit">
              {datos
                ? `Por qué siguen incompletas las ${numero(incompletos)} pólizas`
                : 'Por qué siguen incompletas'}
              <span className="mx-resumen-grupo-nota">
                Cada póliza cuenta una sola vez, en el primer motivo que aplica.
              </span>
            </p>
            <div id={gridId} className="mx-resumen-grid">
              {categorias.map(({ key, label, desc }) => {
                const v = desglose ? desglose[key] : null;
                const tono = TONO_BANDA[key];
                return (
                  <Cifra
                    key={key}
                    label={label}
                    valor={v}
                    desc={desc}
                    className={`mx-resumen-item--extra ${tono && v ? `is-${tono}` : ''}`}
                  />
                );
              })}
            </div>
            {datos && desglose && (
              <p className="mx-resumen-suma mx-num">
                {lineaSumaIncompletos(datos.incompletos, desglose, datos.validacion)}
              </p>
            )}
          </div>
        )}

        {/* Pago: otra dimensión, no suma con el estado documental */}
        <div id={pagoId} className="mx-resumen-pago">
          <p className="mx-resumen-grupo-tit">Pago, aparte del estado documental</p>
          <Cifra
            label="Pendientes de pago"
            valor={valor('pendientesPago')}
            desc="Emitidas como pendientes de cobro. No suma con lo demás: una póliza completa o incompleta puede estar pendiente de pago."
          />
        </div>
      </div>

      <div className="mx-resumen-pie">
        <p className={cuadre ? 'mx-resumen-cuadre' : 'mx-resumen-nota'}>
          Cifras en pólizas.{' '}
          {cuadre
            ? `${filtrado ? 'En las fechas elegidas: ' : ''}${cuadre}`
            : filtrado
              ? 'Según los filtros de fecha y área.'
              : 'Acumulado de las pólizas en el monitor.'}
        </p>
        <button
          type="button"
          className="mx-resumen-mas"
          aria-expanded={abierto}
          aria-controls={verDesglose ? `${gridId} ${pagoId}` : pagoId}
          onClick={() => setAbierto((a) => !a)}
        >
          {abierto ? 'Ver menos' : 'Ver todo el resumen'}
          {abierto ? <ChevronUp size={14} aria-hidden /> : <ChevronDown size={14} aria-hidden />}
        </button>
      </div>
    </section>
  );
}
