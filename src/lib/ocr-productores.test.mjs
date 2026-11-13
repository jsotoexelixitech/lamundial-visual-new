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
  filasProductores,
  normalizarCatalogoProductores,
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

test('catálogo: normaliza; sin la clave, vacío o inválido queda null (respaldo por código)', () => {
  assert.equal(normalizarCatalogoProductores(undefined), null);
  assert.equal(normalizarCatalogoProductores(null), null);
  assert.equal(normalizarCatalogoProductores([]), null);
  assert.deepEqual(
    normalizarCatalogoProductores([
      { codigo: ' 10 ', nombre: ' Ana ' },
      { codigo: 20, nombre: null },
      { codigo: '10', nombre: 'Repetido' },
      { codigo: 'con espacio' },
      null,
    ]),
    [
      { codigo: '10', nombre: 'Ana' },
      { codigo: '20', nombre: '' },
    ],
  );
});

test('lista: primero los guardados con OCR opcional, luego el catálogo; límite solo a los no marcados', () => {
  const catalogo = Array.from({ length: 500 }, (_, i) => ({
    codigo: String(i + 1),
    nombre: `Productor ${i + 1}`,
  }));
  const seleccion = [
    { codigo: '400', nombre: 'Productor 400' },
    { codigo: 'X-9', nombre: 'Fuera del catálogo' },
    { codigo: '450', nombre: null },
  ];
  const r = filasProductores(catalogo, seleccion, ['400', 'X-9'], '', 3);
  assert.equal(r.total, 501);
  assert.equal(r.coinciden, 501);
  assert.deepEqual(
    r.filas.map((f) => f.codigo),
    ['X-9', '400', '1', '2', '3', '450'],
  );
  assert.deepEqual(r.filas[0], {
    codigo: 'X-9',
    nombre: 'Fuera del catálogo',
    opcional: true,
    enCatalogo: false,
  });
  assert.equal(r.filas[5].nombre, 'Productor 450');
  assert.equal(r.filas[2].opcional, false);
});

test('lista: al apagar uno guardado la fila no se mueve ni desaparece', () => {
  const catalogo = [
    { codigo: '1', nombre: 'Uno' },
    { codigo: '2', nombre: 'Dos' },
    { codigo: '3', nombre: 'Tres' },
  ];
  const r = filasProductores(catalogo, [], ['3'], '', 1);
  assert.deepEqual(
    r.filas.map((f) => [f.codigo, f.opcional]),
    [
      ['3', false],
      ['1', false],
    ],
  );
});

test('búsqueda: por código o nombre, sin distinguir mayúsculas ni acentos', () => {
  const catalogo = [
    { codigo: '1234', nombre: 'GARCÍA PÉREZ, ANA' },
    { codigo: '555', nombre: 'Corretaje Uno' },
    { codigo: '9123', nombre: 'Otro' },
  ];
  const cod = (q) => filasProductores(catalogo, [], [], q, 50).filas.map((f) => f.codigo);
  assert.deepEqual(cod('garcia'), ['1234']);
  assert.deepEqual(cod(' 123 '), ['1234', '9123']);
  assert.deepEqual(cod('CORRETAJE'), ['555']);
  const r = filasProductores(catalogo, [], [], 'zzz', 50);
  assert.deepEqual([r.filas.length, r.coinciden, r.total], [0, 0, 3]);
});
