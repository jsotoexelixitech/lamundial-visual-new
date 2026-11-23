/**
 * Pruebas de cómo se pinta cada dato comparado en el detalle del expediente.
 * El portal no tiene runner: `node --test src/pages/expedientes/diagnostico-campo.test.mjs`
 * (Node ≥ 23.6, que importa TypeScript sin flags).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { claseFilaCampo, marcaCampo } from './diagnostico-campo.ts';

test('informativo («difiere», p. ej. modelo BR frente a BR250-GR): neutro, no en rojo ni «No coincide»', () => {
  const marca = marcaCampo({ estado: 'difiere', coincide: false });
  assert.equal(marca, 'informativo');
  assert.equal(claseFilaCampo(marca), 'mx-diag-info');
});

test('no coincide sigue en rojo', () => {
  const marca = marcaCampo({ estado: 'no_coincide', coincide: false });
  assert.equal(marca, 'no_coincide');
  assert.equal(claseFilaCampo(marca), 'mx-diag-no');
});

test('modificado en el formulario: rojo + violeta, como antes', () => {
  const marca = marcaCampo({ estado: 'modificado_en_formulario', coincide: false });
  assert.equal(marca, 'modificado');
  assert.equal(claseFilaCampo(marca), 'mx-diag-no mx-diag-mod');
});

test('coincide y sin dato: sin color de fila; «no se leyó» distinto de «sin dato en la póliza»', () => {
  assert.equal(marcaCampo({ estado: 'coincide', coincide: true }), 'coincide');
  assert.equal(claseFilaCampo('coincide'), undefined);
  assert.equal(marcaCampo({ estado: 'sin_dato_documento', coincide: null }), 'no_leido');
  assert.equal(marcaCampo({ estado: 'sin_dato_poliza', coincide: null }), 'sin_dato_poliza');
  // Diagnósticos viejos sin estado: igual que antes.
  assert.equal(marcaCampo({ estado: null, coincide: false }), 'no_coincide');
  assert.equal(marcaCampo({ coincide: null }), 'sin_dato_poliza');
});
