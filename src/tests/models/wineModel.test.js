import {
  getAllWines,
  getAllWinesPaginated,
  getWineById,
  getWineByCodigoDeBarras,
  getWineByCodigo,
  createWine,
  updateWine,
  deleteWine
} from '../../models/wineModel.js';
import { winesData } from '../data/wineTestData.js';
import pool from '../../db.js';

describe('wineModel', () => {
  let testWine;

  // Sample wine data
  const wineData = winesData[0];
  const wineData2 = winesData[1];
  const wineData3 = winesData[2];


  // Start a transaction before each test
  beforeEach(async () => {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM vinos'); // Clean table
    testWine = await createWine(wineData);
    testWine2 = await createWine(wineData2);
    testWine3 = await createWine(wineData3);
  });

  // Rollback after each test
  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('createWine inserts a wine and returns it', async () => {
    expect(testWine).toHaveProperty('id');
    expect(testWine.nombre).toBe(wineData.nombre);
  });

  test('getAllWines returns an array including the created wine', async () => {
    const wines = await getAllWines();
    expect(Array.isArray(wines)).toBe(true);
    expect(wines.some(w => w.id === testWine.id)).toBe(true);
  });

  test('getAllWinesPaginated returns paginated results', async () => {
    const wines = await getAllWinesPaginated(0, 10, 'ASC', 'nombre');
    expect(Array.isArray(wines)).toBe(true);
    expect(wines.length).toBeGreaterThan(1);
    expect(wines.some(w => w.id === testWine.id)).toBe(true);
    expect(wines.some(w => w.id === testWine2.id)).toBe(true);
    expect(wines.some(w => w.id === testWine3.id)).toBe(true);
  });

  test('getWineById returns the correct wine', async () => {
    const wine = await getWineById(testWine.id);
    expect(wine).toBeDefined();
    expect(wine.id).toBe(testWine.id);
  });

  test('getWineByCodigoDeBarras returns the correct wine', async () => {
    const wine = await getWineByCodigoDeBarras(wineData.codigoDeBarras);
    expect(wine).toBeDefined();
    expect(wine.codigodebarras).toBe(wineData.codigoDeBarras);
  });

  test('getWineByCodigo returns the correct wine', async () => {
    const wine = await getWineByCodigo(wineData.codigo);
    expect(wine).toBeDefined();
    expect(wine.codigo).toBe(wineData.codigo);
  });

  test('updateWine updates the wine and returns the updated row', async () => {
    const updated = await updateWine(testWine.id, { ...wineData, nombre: 'Updated Wine' });
    expect(updated.nombre).toBe('Updated Wine');
  });

  test('deleteWine deletes the wine and returns the deleted row', async () => {
    const deleted = await deleteWine(testWine.id);
    expect(deleted.id).toBe(testWine.id);
    const shouldBeNull = await getWineById(testWine.id);
    expect(shouldBeNull).toBeUndefined();
  });
});
