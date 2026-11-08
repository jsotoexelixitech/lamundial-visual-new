import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import type { Indicadores, KpisExpedientes, TopIncompleto } from '@/lib/expedientes-api';
import { etiquetaProducto, etiquetaRequisito, numero } from './expedientes-format';
import { useCuenta } from './expedientes-anim';
import type { TonoGrafico } from './expedientes-ui';

/*
 * KPI principales de la pestaña Indicadores. Reglas:
 * - nada inventado: si Nexus manda `null`, se lee «Sin dato»;
 * - cada número se ve escrito (sin pasar el cursor); el color sigue el código de estados;
 * - los porcentajes se redondean hacia abajo (nunca 100 % si falta algo).
 */

const SIN_DATO = 'Sin dato';
const pctAbajo = (r: number) => Math.floor(r * 100);
const dias = (v: number) =>
  v.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Número animado (cuenta desde 0) con el valor final para lectores de pantalla. */
function Cifra({
  valor,
  clave,
  formato = (v) => numero(Math.round(v)),
}: {
  valor: number | null;
  clave: unknown;
  formato?: (v: number) => string;
}) {
  const v = useCuenta(valor, clave);
  if (valor == null) return <span className="mx-kpi-sindato">{SIN_DATO}</span>;
  return (
    <>
      <span aria-hidden>{formato(v)}</span>
      <span className="sr-only">{formato(valor)}</span>
    </>
  );
}

/** «¿Qué mide?» plegable: funciona con teclado y en el móvil (no depende del cursor). */
function QueMide({ children }: { children: React.ReactNode }) {
  return (
    <details className="mx-que-mide">
      <summary>
        <Info size={13} aria-hidden />
        ¿Qué mide?
      </summary>
      <p>{children}</p>
    </details>
  );
}

function Anillo({ valor }: { valor: number | null }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const p = valor == null ? 0 : Math.max(0, Math.min(1, valor));
  return (
    <svg className="mx-anillo" viewBox="0 0 72 72" width="72" height="72" aria-hidden>
      <circle className="mx-anillo-pista" cx="36" cy="36" r={r} />
      {p > 0 && (
        <circle
          className="mx-anillo-valor"
          cx="36"
          cy="36"
          r={r}
          style={
            {
              strokeDasharray: c,
              strokeDashoffset: c * (1 - p),
              '--mx-anillo-c': c,
            } as React.CSSProperties
          }
        />
      )}
    </svg>
  );
}

/**
 * Mini-gráfico de 30 días: una barra por día; los últimos `resaltar` días van en el color
 * del indicador y el resto en gris. Escala propia (no se compara con otro gráfico).
 */
function Tendencia30({
  dias: serie,
  titulo,
  resaltar = 0,
  tono = 'verde',
}: {
  dias: { fecha: string; valor: number }[];
  titulo: string;
  resaltar?: number;
  tono?: TonoGrafico;
}) {
  if (serie.length === 0) return null;
  const max = Math.max(1, ...serie.map((d) => d.valor));
  const total = serie.reduce((a, d) => a + d.valor, 0);
  const pico = serie.reduce((a, d) => (d.valor > a.valor ? d : a), serie[0]);
  const fmt = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;
  return (
    <figure className="mx-spark">
      <div
        className="mx-spark-barras"
        role="img"
        aria-label={`${titulo}: ${numero(total)} en 30 días; máximo ${numero(pico.valor)} el ${fmt(pico.fecha)}`}
      >
        {serie.map((d, i) => (
          <span
            key={d.fecha}
            className={`mx-spark-barra ${i >= serie.length - resaltar ? `is-${tono}` : 'is-tenue'}`}
            style={{ height: d.valor > 0 ? `max(2px, ${(d.valor / max) * 100}%)` : '0' }}
            title={`${fmt(d.fecha)}: ${numero(d.valor)}`}
          />
        ))}
      </div>
      <figcaption className="mx-spark-pie">
        <span>{fmt(serie[0].fecha)}</span>
        <span>
          {titulo} · máx. <strong className="mx-num">{numero(pico.valor)}</strong>
        </span>
        <span>{fmt(serie[serie.length - 1].fecha)}</span>
      </figcaption>
    </figure>
  );
}

/** Tarjetas de KPI principales (lo que pide atención va junto al avance). */
export function KpiPrincipales({ d, clave }: { d: Indicadores; clave: unknown }) {
  const k = d.kpis;
  if (!k) {
    return (
      <div className="mx-aviso mx-aviso--info" role="status">
        <Info size={18} aria-hidden className="shrink-0 mt-0.5" />
        <p>Los KPI aún no están disponibles en este ambiente. Abajo siguen las cifras por área.</p>
      </div>
    );
  }
  const base = d.completos + d.incompletos;
  const completadasDia = k.tendencia.map((t) => ({ fecha: t.fecha, valor: t.completadas }));
  return (
    <div className="mx-kpis" role="list" aria-label="Indicadores principales">
      <article className="mx-kpi mx-kpi--anillo" role="listitem">
        <h3 className="mx-kpi-tit">Expedientes completos</h3>
        <div className="mx-kpi-anillo-fila">
          <div className="mx-anillo-caja">
            <Anillo valor={k.tasaCompletitud} />
            <span className="mx-anillo-texto mx-num">
              {k.tasaCompletitud == null ? (
                <span className="mx-kpi-sindato">{SIN_DATO}</span>
              ) : (
                <>
                  <Cifra valor={pctAbajo(k.tasaCompletitud)} clave={clave} />
                  <small>%</small>
                </>
              )}
            </span>
          </div>
          <p className="mx-kpi-sub">
            <strong className="mx-num">{numero(d.completos)}</strong> de{' '}
            <strong className="mx-num">{numero(base)}</strong> pólizas con documentos completos
          </p>
        </div>
        <QueMide>
          Pólizas con todos los documentos validados entre las que tienen documentos que revisar
          (completas + incompletas). Las «Sin información» no cuentan.
        </QueMide>
      </article>

      <article
        className={`mx-kpi ${d.conErrores > 0 ? 'is-rojo' : d.datosModificados > 0 ? 'is-violeta' : ''}`}
        role="listitem"
      >
        <h3 className="mx-kpi-tit">Piden atención</h3>
        <div className="mx-kpi-par">
          <div className={d.conErrores > 0 ? 'is-rojo' : ''}>
            <strong className="mx-kpi-valor mx-num">
              <Cifra valor={d.conErrores} clave={clave} />
            </strong>
            <span>con errores</span>
          </div>
          <div className={d.datosModificados > 0 ? 'is-violeta' : ''}>
            <strong className="mx-kpi-valor mx-num">
              <Cifra valor={d.datosModificados ?? null} clave={clave} />
            </strong>
            <span>datos cambiados</span>
          </div>
        </div>
        <QueMide>
          Con errores: algún documento no coincide, es ilegible o la IA no tuvo certeza. Datos
          cambiados: la póliza se emitió con datos distintos a los que se leyeron del documento.
        </QueMide>
      </article>

      <article className="mx-kpi mx-kpi--spark" role="listitem">
        <h3 className="mx-kpi-tit">Completados en 7 días</h3>
        <p className="mx-kpi-valor mx-num">
          <Cifra valor={k.completadosUltimos7Dias} clave={clave} />
        </p>
        <Tendencia30 dias={completadasDia} titulo="Completados por día" resaltar={7} tono="verde" />
        <QueMide>
          Expedientes que quedaron completos en los últimos 7 días. El gráfico muestra los 30 días
          (hora de Caracas); los 7 últimos van en verde.
        </QueMide>
      </article>

      <article className="mx-kpi" role="listitem">
        <h3 className="mx-kpi-tit">Tiempo medio para completar</h3>
        <p className="mx-kpi-valor mx-num">
          <Cifra valor={k.tiempoMedioCompletarDias} clave={clave} formato={dias} />
          {k.tiempoMedioCompletarDias != null && <small> días</small>}
        </p>
        <QueMide>
          Días, en promedio, desde la emisión hasta que el expediente quedó completo. Solo cuenta
          los completos que tienen fecha de completado.
        </QueMide>
      </article>

      <article className="mx-kpi" role="listitem">
        <h3 className="mx-kpi-tit">Recuperación por recordatorios</h3>
        <p className="mx-kpi-valor mx-num">
          {k.tasaRecuperacion == null ? (
            <span className="mx-kpi-sindato">{SIN_DATO}</span>
          ) : (
            <>
              <Cifra valor={pctAbajo(k.tasaRecuperacion)} clave={clave} />
              <small> %</small>
            </>
          )}
        </p>
        <p className="mx-kpi-sub">
          <strong className="mx-num">{numero(k.recordatorios.recuperados)}</strong> de{' '}
          <strong className="mx-num">{numero(k.recordatorios.recibieron)}</strong> que recibieron un
          recordatorio completaron
        </p>
        <QueMide>
          De las pólizas a las que se les envió al menos un correo de la cadencia, cuántas tienen
          hoy el expediente completo. El correo de prueba no cuenta.
        </QueMide>
      </article>
    </div>
  );
}

/** Siluetas de las tarjetas mientras carga (brillo suave). */
export function EsqueletoKpi() {
  return (
    <div className="mx-kpis" role="status" aria-live="polite">
      <span className="sr-only">Cargando indicadores…</span>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={`mx-kpi mx-kpi--esq ${i === 0 ? 'mx-kpi--anillo' : ''}`} aria-hidden>
          <span className="mx-esqueleto-linea" style={{ width: '55%' }} />
          {i === 0 ? (
            <span className="mx-esq-anillo" />
          ) : (
            <span className="mx-esqueleto-linea mx-esq-valor" style={{ width: '35%' }} />
          )}
          <span className="mx-esqueleto-linea" style={{ width: '80%' }} />
        </div>
      ))}
    </div>
  );
}

// ─── Paneles de detalle ───────────────────────────────────────────────────

/** Plegable de la pestaña: abierto en escritorio, plegado en el móvil (la cifra clave se ve en el título). */
function Plegable({
  titulo,
  resumen,
  abiertoInicial,
  children,
}: {
  titulo: string;
  resumen?: React.ReactNode;
  abiertoInicial: boolean;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  return (
    <details
      className="mx-panel mx-ind-tarjeta"
      open={abierto}
      onToggle={(e) => setAbierto((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>
        <h3 className="mx-h2">{titulo}</h3>
        {resumen && <span className="mx-ind-resumen">{resumen}</span>}
        <ChevronDown size={18} className={`mx-plegable-chev ${resumen ? '' : 'ml-auto'}`} aria-hidden />
      </summary>
      <div className="mx-ind-cuerpo">{children}</div>
    </details>
  );
}

type Serie = { key: string; label: string; tono: TonoGrafico | 'faltante' };

/**
 * Filas con barra apilada y sus cifras escritas debajo («812 completos · 380 incompletos»).
 * Una sola leyenda arriba. Sirve para productos y para documentos.
 */
function FilasApiladas({
  titulo,
  series,
  filas,
}: {
  titulo: string;
  series: Serie[];
  filas: { label: string; total: number; valores: Record<string, number> }[];
}) {
  return (
    <figure className="mx-graf">
      <figcaption className="sr-only">{titulo}</figcaption>
      <ul className="mx-graf-leyenda mx-graf-leyenda--fila" aria-hidden>
        {series.map((s) => (
          <li key={s.key}>
            <span className={`mx-graf-muestra is-${s.tono}`} />
            <span className="mx-graf-label">{s.label}</span>
          </li>
        ))}
      </ul>
      <ul className="mx-filas">
        {filas.map((f) => {
          const partes = series.filter((s) => (f.valores[s.key] ?? 0) > 0);
          const suma = series.reduce((a, s) => a + (f.valores[s.key] ?? 0), 0);
          return (
            <li key={f.label}>
              <div className="mx-filas-cab">
                <span className="mx-filas-label">{f.label}</span>
                <span className="mx-num mx-filas-total">{numero(f.total)}</span>
              </div>
              <div
                className="mx-apilada"
                role="img"
                aria-label={`${f.label}: ${series.map((s) => `${s.label} ${f.valores[s.key] ?? 0}`).join(', ')}`}
              >
                {suma === 0 ? (
                  <span className="mx-apilada-vacia" />
                ) : (
                  partes.map((s) => (
                    <span
                      key={s.key}
                      className={`mx-apilada-seg is-${s.tono}`}
                      style={{ flexGrow: f.valores[s.key] }}
                      title={`${s.label}: ${f.valores[s.key]}`}
                    />
                  ))
                )}
              </div>
              <p className="mx-filas-cifras">
                {partes.length === 0
                  ? 'Sin datos'
                  : partes.map((s) => (
                      <span key={s.key}>
                        <strong className="mx-num">{numero(f.valores[s.key])}</strong> {s.label.toLowerCase()}
                      </span>
                    ))}
              </p>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

function ListaTop({ titulo, items }: { titulo: string; items: TopIncompleto[] }) {
  const max = Math.max(1, ...items.map((i) => i.incompletos));
  return (
    <figure className="mx-graf mx-top">
      <figcaption className="mx-graf-titulo">{titulo}</figcaption>
      {items.length === 0 ? (
        <p className="text-xs mx-muted">Sin incompletos en el período.</p>
      ) : (
        <ol className="mx-top-lista">
          {items.map((it) => (
            <li key={it.codigo}>
              <span className="mx-top-cod mx-num" title={it.codigo}>
                {it.codigo}
              </span>
              <span className="mx-barras-pista" aria-hidden>
                <span
                  className="mx-barras-relleno is-ambar"
                  style={{ width: `max(4px, ${(it.incompletos / max) * 100}%)` }}
                />
              </span>
              <span className="mx-top-valor">
                <strong className="mx-num">{numero(it.incompletos)}</strong>
                <span className="mx-num"> de {numero(it.total)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </figure>
  );
}

/** Embudo, documentos, top 5, productos y tendencia (debajo de las tarjetas). */
export function PanelesKpi({ d, escritorio }: { d: Indicadores; escritorio: boolean }) {
  const k: KpisExpedientes | undefined = d.kpis;
  if (!k) return null;
  const r = k.recordatorios;
  const base = Math.max(1, d.total);
  const embudo: { label: string; valor: number; tono: TonoGrafico }[] = [
    { label: 'Pólizas en el período', valor: d.total, tono: 'tinta' },
    { label: 'Recibieron recordatorio', valor: r.recibieron, tono: 'azul' },
    { label: 'Completaron después', valor: r.recuperados, tono: 'verde' },
  ];
  const noLlego: { label: string; valor: number; tono?: 'rojo' | 'ambar' }[] = [
    { label: 'Error de envío', valor: r.error, tono: 'rojo' },
    { label: 'Sin correo', valor: r.sinCorreo, tono: 'ambar' },
    { label: 'Cadencia agotada', valor: r.agotados, tono: 'ambar' },
    { label: 'Bloqueados por lista blanca', valor: r.bloqueados },
    { label: 'Excluidos al enviar', valor: r.excluidos },
    { label: 'Marcadas «No enviar»', valor: r.noEnviar },
  ];
  const docsAtencion = k.porDocumento.reduce((a, x) => a + x.faltante + x.observado, 0);
  const topTotal =
    k.topIncompletos.canales.length + k.topIncompletos.gestores.length + k.topIncompletos.productores.length;
  const emitidas = k.tendencia.map((t) => ({ fecha: t.fecha, valor: t.emitidas }));
  const completadas = k.tendencia.map((t) => ({ fecha: t.fecha, valor: t.completadas }));

  return (
    <>
      <Plegable
        titulo="Embudo de recordatorios"
        resumen={
          <>
            <strong className="mx-num">{numero(r.recibieron)}</strong> recibieron
          </>
        }
        abiertoInicial={escritorio}
      >
        <ul className="mx-embudo" aria-label="Embudo de recordatorios">
          {embudo.map((e) => (
            <li key={e.label}>
              <span className="mx-barras-label">{e.label}</span>
              <span className="mx-embudo-pista" aria-hidden>
                <span
                  className={`mx-barras-relleno is-${e.tono}`}
                  style={{ width: e.valor > 0 ? `max(4px, ${(e.valor / base) * 100}%)` : '0' }}
                />
              </span>
              <span className="mx-barras-valor mx-num">{numero(e.valor)}</span>
            </li>
          ))}
        </ul>
        <div>
          <p className="mx-graf-titulo mb-2">No llegaron o no se enviaron</p>
          <div className="mx-kpi-mini">
            {noLlego.map((x) => (
              <div key={x.label} className={x.tono && x.valor > 0 ? `is-${x.tono}` : ''}>
                <strong>{numero(x.valor)}</strong>
                <span>{x.label}</span>
              </div>
            ))}
          </div>
        </div>
        <QueMide>
          Pólizas distintas según el resultado de los correos de la cadencia (solicitud inicial y
          recordatorios). Una póliza puede aparecer en más de un resultado si tuvo varios envíos.
          «Cadencia agotada»: se enviaron todas las etapas y sigue incompleta.
        </QueMide>
      </Plegable>

      <Plegable
        titulo="Documentos por estado"
        resumen={
          <>
            <strong className="mx-num">{numero(docsAtencion)}</strong> sin cargar u observados
          </>
        }
        abiertoInicial={escritorio}
      >
        {k.porDocumento.length === 0 ? (
          <p className="text-xs mx-muted">Sin documentos en el período.</p>
        ) : (
          <FilasApiladas
            titulo="Documentos por estado"
            series={[
              { key: 'validado', label: 'Validados', tono: 'verde' },
              { key: 'recibido', label: 'Recibidos', tono: 'azul' },
              { key: 'observado', label: 'Observados', tono: 'ambar' },
              { key: 'faltante', label: 'No cargados', tono: 'faltante' },
            ]}
            filas={k.porDocumento.map((x) => ({
              label: etiquetaRequisito(x.tipo),
              total: x.faltante + x.recibido + x.observado + x.validado,
              valores: { faltante: x.faltante, recibido: x.recibido, observado: x.observado, validado: x.validado },
            }))}
          />
        )}
      </Plegable>

      <Plegable
        titulo="Más incompletos"
        resumen={topTotal ? 'Top 5 por grupo' : 'Sin incompletos'}
        abiertoInicial={escritorio}
      >
        <div className="mx-top-grid">
          <ListaTop titulo="Canales alternos" items={k.topIncompletos.canales} />
          <ListaTop titulo="Gestores" items={k.topIncompletos.gestores} />
          <ListaTop titulo="Productores" items={k.topIncompletos.productores} />
        </div>
        <p className="text-xs mx-muted">Incompletos de las pólizas de cada código en el período.</p>
      </Plegable>

      <Plegable
        titulo="Por producto"
        resumen={
          <>
            <strong className="mx-num">{numero(k.porProducto.length)}</strong>{' '}
            {k.porProducto.length === 1 ? 'producto' : 'productos'}
          </>
        }
        abiertoInicial={escritorio}
      >
        {k.porProducto.length === 0 ? (
          <p className="text-xs mx-muted">Sin pólizas en el período.</p>
        ) : (
          <FilasApiladas
            titulo="Estado documental por producto"
            series={[
              { key: 'completos', label: 'Completos', tono: 'verde' },
              { key: 'incompletos', label: 'Incompletos', tono: 'ambar' },
              { key: 'otros', label: 'Sin información', tono: 'gris' },
            ]}
            filas={k.porProducto.map((p) => ({
              label: etiquetaProducto(p.producto),
              total: p.total,
              valores: {
                completos: p.completos,
                incompletos: p.incompletos,
                otros: Math.max(0, p.total - p.completos - p.incompletos),
              },
            }))}
          />
        )}
      </Plegable>

      <Plegable
        titulo="Últimos 30 días"
        resumen={
          <>
            <strong className="mx-num">{numero(emitidas.reduce((a, x) => a + x.valor, 0))}</strong> emitidas
          </>
        }
        abiertoInicial={escritorio}
      >
        <div className="mx-top-grid">
          <Tendencia30 dias={emitidas} titulo="Emitidas por día" resaltar={30} tono="tinta" />
          <Tendencia30 dias={completadas} titulo="Completados por día" resaltar={30} tono="verde" />
        </div>
        <p className="text-xs mx-muted">Hora de Caracas. Cada gráfico tiene su propia escala.</p>
      </Plegable>
    </>
  );
}
