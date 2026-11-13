/**
 * Pruebas de la lógica de «OCR opcional por productor» del monitor.
 * El portal no tiene runner: `node --test src/lib/ocr-productores.test.mjs` (Node ≥ 23.6,
 * que importa TypeScript sin flags).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  agregarProductor,
  codigoProductorValido,
  cuerpoProductores,
  normalizarProductores,
  quitarProductor,
} from './ocr-productores.ts';

test('normaliza la respuesta de Nexus; sin la clave (Nexus anterior) queda vacío', () => {
  assert.deepEqual(normalizarProductores(undefined), []);
  assert.deepEqual(normalizarProductores('x'), []);
  assert.deepEqual(
    normalizarProductores([
      { codigo: ' 1234 ', nombre: ' Productor Uno ', ocrOpcional: true },
      { codigo: 555, nombre: null },
      { codigo: '1234', nombre: 'Repetido' },
      { codigo: '' },
      null,
    ]),
    [
      { codigo: '1234', nombre: 'Productor Uno' },
      { codigo: '555', nombre: null },
    ],
  );
});

test('agregar: por código + nombre, sin duplicar y sin aceptar códigos inválidos', () => {
  let lista = agregarProductor([], ' 1234 ', ' Productor Uno ');
  assert.deepEqual(lista, [{ codigo: '1234', nombre: 'Productor Uno' }]);
  lista = agregarProductor(lista, '555');
  assert.deepEqual(lista.map((p) => p.codigo), ['1234', '555']);
  assert.equal(lista[1].nombre, null);
  // Ya estaba: no se duplica; con nombre nuevo, lo actualiza.
  assert.equal(agregarProductor(lista, '1234'), lista);
  assert.deepEqual(agregarProductor(lista, '1234', 'Otro nombre')[0], {
    codigo: '1234',
    nombre: 'Otro nombre',
  });
  // Inválidos: misma lista.
  assert.equal(agregarProductor(lista, ''), lista);
  assert.equal(agregarProductor(lista, '12 34'), lista);
  assert.equal(agregarProductor(lista, 'a;b'), lista);
});

test('quitar: el productor vuelve a obligatorio y los demás quedan igual', () => {
  const lista = [
    { codigo: '1234', nombre: 'Productor Uno' },
    { codigo: '555', nombre: null },
  ];
  assert.deepEqual(quitarProductor(lista, '1234'), [{ codigo: '555', nombre: null }]);
  assert.deepEqual(quitarProductor(lista, '999'), lista);
});

test('cuerpo del PUT: lista completa, nombres solo de los que tienen y base cargada', () => {
  assert.deepEqual(
    cuerpoProductores(
      [
        { codigo: '1234', nombre: 'Productor Uno' },
        { codigo: '555', nombre: null },
      ],
      ['1234'],
    ),
    {
      productores: ['1234', '555'],
      productoresNombres: { 1234: 'Productor Uno' },
      baseProductores: ['1234'],
    },
  );
  assert.deepEqual(cuerpoProductores([], []), {
    productores: [],
    productoresNombres: {},
    baseProductores: [],
  });
});

test('formato del código', () => {
  assert.equal(codigoProductorValido('1234'), true);
  assert.equal(codigoProductorValido(' 80080-11 '), true);
  assert.equal(codigoProductorValido(''), false);
  assert.equal(codigoProductorValido(null), false);
  assert.equal(codigoProductorValido('x'.repeat(33)), false);
});
