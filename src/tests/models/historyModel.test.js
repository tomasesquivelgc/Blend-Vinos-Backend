import { addHistory } from '../../models/historyModel.js';
import pool from '../../db.js';
import { createUser } from '../../models/userModel.js';
import { createWine } from '../../models/wineModel.js';
import bcrypt from 'bcrypt';
import { historyData } from '../data/historyTestData.js';

describe('historyModel', () => {
  let testHistory1, testHistory2, testHistory3;

  beforeEach(async () => {
    // Clean child tables to ensure no FK conflicts
    await pool.query('DELETE FROM movimiento_detalle');
    await pool.query('DELETE FROM historial');

    // Create test users and wines and use their IDs in history entries
    const pw = await bcrypt.hash('testpass', 10);
    const user1 = await createUser({ nombre: 'HistUser1', rol_id: 1, email: 'hu1@example.com', contrasena: pw, nombreDeUsuario: `hist_user_${Date.now()}_1`, telefono: '000' });
    const user2 = await createUser({ nombre: 'HistUser2', rol_id: 1, email: 'hu2@example.com', contrasena: pw, nombreDeUsuario: `hist_user_${Date.now()}_2`, telefono: '000' });
    const user3 = await createUser({ nombre: 'HistUser3', rol_id: 1, email: 'hu3@example.com', contrasena: pw, nombreDeUsuario: `hist_user_${Date.now()}_3`, telefono: '000' });

    const wine1 = await createWine({ codigoDeBarras: `${Date.now()}1`, codigo: `HISTW1_${Date.now()}`, nombre: 'HistWine1', cepa: 'X', anejamiento: '0', bodega: 'B', distribuidor: 'D', estilo: 'T', total: 10, stockReal: 10, costo: 100 });
    const wine2 = await createWine({ codigoDeBarras: `${Date.now()}2`, codigo: `HISTW2_${Date.now()}`, nombre: 'HistWine2', cepa: 'X', anejamiento: '0', bodega: 'B', distribuidor: 'D', estilo: 'T', total: 10, stockReal: 10, costo: 100 });
    const wine3 = await createWine({ codigoDeBarras: `${Date.now()}3`, codigo: `HISTW3_${Date.now()}`, nombre: 'HistWine3', cepa: 'X', anejamiento: '0', bodega: 'B', distribuidor: 'D', estilo: 'T', total: 10, stockReal: 10, costo: 100 });

    // Prepare history entries based on historyData but with created ids
    const h1 = { ...historyData[0], vino_id: wine1.id, usuario_id: user1.id };
    const h2 = { ...historyData[1], vino_id: wine2.id, usuario_id: user2.id };
    const h3 = { ...historyData[2], vino_id: wine3.id, usuario_id: user3.id };

    testHistory1 = await addHistory({ usuario_id: h1.usuario_id, cliente_id: h1.cliente_id, accion: h1.accion, costo: h1.costo, comentario: h1.comentario, nombre_de_cliente: h1.vino_nombre });
    testHistory2 = await addHistory({ usuario_id: h2.usuario_id, cliente_id: h2.cliente_id, accion: h2.accion, costo: h2.costo, comentario: h2.comentario, nombre_de_cliente: h2.vino_nombre });
    testHistory3 = await addHistory({ usuario_id: h3.usuario_id, cliente_id: h3.cliente_id, accion: h3.accion, costo: h3.costo, comentario: h3.comentario, nombre_de_cliente: h3.vino_nombre });
  });

  afterEach(async () => {
    // Remove created history and wines/users to keep DB tidy
    await pool.query('DELETE FROM movimiento_detalle');
    await pool.query('DELETE FROM historial');
    await pool.query("DELETE FROM vinos WHERE nombre LIKE 'HistWine%'");
    await pool.query("DELETE FROM usuarios WHERE nombre LIKE 'HistUser%'");
  });

  afterAll(async () => {
    await pool.end();
  });

  test('addHistory inserts a history record and returns it', async () => {
    expect(testHistory1).toHaveProperty('id');
    expect(testHistory1.accion).toBe(historyData[0].accion);
    expect(testHistory1.comentario).toBe(historyData[0].comentario);
  });

  test('addHistory works for multiple records', async () => {
    expect(testHistory2).toHaveProperty('id');
    expect(testHistory2.accion).toBe(historyData[1].accion);
    expect(testHistory3).toHaveProperty('id');
    expect(testHistory3.accion).toBe(historyData[2].accion);
  });
});
