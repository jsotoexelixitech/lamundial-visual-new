/**
 * Cómo se pinta cada dato comparado por la IA en el detalle del expediente (sin dependencias, para
 * probarlo con `node --test`).
 */

/** Marca de la columna «¿Coincide?». */
export type MarcaCampo =
  | 'modificado'
  | 'informativo'
  | 'coincide'
  | 'no_coincide'
  | 'no_leido'
  | 'sin_dato_poliza';

/** v1.3: el dato de la póliza se cambió a mano en el formulario respecto a lo que leyó el OCR. */
const MODIFICADO = 'modificado_en_formulario';

/**
 * Diferencia informativa (`difiere`): no cuenta como error (p. ej. modelo «BR» frente a «BR250-GR»,
 * o el apellido de casada de la misma persona). Se pinta neutra, no en rojo.
 */
const INFORMATIVO = 'difiere';

export function marcaCampo(c: {
  estado?: string | null;
  coincide: boolean | null;
}): MarcaCampo {
  if (c.estado === MODIFICADO) return 'modificado';
  if (c.estado === INFORMATIVO) return 'informativo';
  if (c.coincide === true) return 'coincide';
  if (c.coincide === false) return 'no_coincide';
  return c.estado === 'sin_dato_documento' ? 'no_leido' : 'sin_dato_poliza';
}

/** Clase de la fila: rojo para lo que no coincide, violeta si se modificó, gris si es informativo. */
export function claseFilaCampo(marca: MarcaCampo): string | undefined {
  switch (marca) {
    case 'modificado':
      return 'mx-diag-no mx-diag-mod';
    case 'informativo':
      return 'mx-diag-info';
    case 'no_coincide':
      return 'mx-diag-no';
    default:
      return undefined;
  }
}
