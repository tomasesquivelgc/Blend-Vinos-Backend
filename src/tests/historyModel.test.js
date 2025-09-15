import { addHistory } from '../models/historyModel.js';
import { historyData } from './historyTestData.js';
import pool from '../db.js';

describe('historyModel', () => {
  let testHistory1, testHistory2, testHistory3;

  beforeEach(async () => {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM historial');
    // Assumes vino_id and usuario_id exist in the test DB
    testHistory1 = await addHistory(historyData[0]);
    testHistory2 = await addHistory(historyData[1]);
    testHistory3 = await addHistory(historyData[2]);
  });

  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('addHistory inserts a history record and returns it', async () => {
    expect(testHistory1).toHaveProperty('id');
    expect(testHistory1.accion).toBe(historyData[0].accion);
    expect(testHistory1.cantidad).toBe(historyData[0].cantidad);
    expect(testHistory1.comentario).toBe(historyData[0].comentario);
  });

  test('addHistory works for multiple records', async () => {
    expect(testHistory2).toHaveProperty('id');
    expect(testHistory2.accion).toBe(historyData[1].accion);
    expect(testHistory3).toHaveProperty('id');
    expect(testHistory3.accion).toBe(historyData[2].accion);
  });
});
