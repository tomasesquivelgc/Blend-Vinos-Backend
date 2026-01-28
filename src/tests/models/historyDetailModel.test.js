import { addHistoryDetail } from '../../models/historyDetailModel.js';
import { addHistory } from '../../models/historyModel.js';
import { createWine } from '../../models/wineModel.js';
import { createUser } from '../../models/userModel.js';
import pool from '../../db.js';
import bcrypt from 'bcrypt';

describe('historyDetailModel', () => {
  let usuario, vino, movimiento;

  beforeEach(async () => {
    // clean child first
    await pool.query('DELETE FROM movimiento_detalle');
    await pool.query('DELETE FROM historial');

    // create user
    const pw = await bcrypt.hash('testpass', 10);
    const unique = Date.now();
    usuario = await createUser({ nombre: `HDUser${unique}`, rol_id: 1, email: `hd${unique}@example.com`, contrasena: pw, nombreDeUsuario: `hduser_${unique}`, telefono: '000' });

    // create wine
    vino = await createWine({ codigoDeBarras: `${unique}`, codigo: `HDW_${unique}`, nombre: `HDWine${unique}`, cepa: 'X', anejamiento: '0', bodega: 'B', distribuidor: 'D', estilo: 'T', total: 10, stockReal: 10, costo: 100 });

    // create movimiento (history)
    movimiento = await addHistory({ usuario_id: usuario.id, cliente_id: null, accion: 'TEST', costo: 0, comentario: 'test movimiento', nombre_de_cliente: vino.nombre });
  });

  afterEach(async () => {
    await pool.query('DELETE FROM movimiento_detalle');
    await pool.query('DELETE FROM historial');
    await pool.query("DELETE FROM vinos WHERE nombre LIKE 'HDWine%'");
    await pool.query("DELETE FROM usuarios WHERE nombre LIKE 'HDUser%'");
  });

  test('addHistoryDetail inserts a detail and returns it', async () => {
    const detail = await addHistoryDetail({ movimiento_id: movimiento.id, vino_id: vino.id, cantidad: 2, precio_unitario: 50 });
    expect(detail).toHaveProperty('id');
    expect(detail.movimiento_id).toBe(movimiento.id);
    expect(detail.vino_id).toBe(vino.id);
    expect(detail.cantidad).toBe(2);
    expect(parseFloat(detail.precio_unitario)).toBeCloseTo(50);
  });

  test('addHistoryDetail works for multiple records', async () => {
    const d1 = await addHistoryDetail({ movimiento_id: movimiento.id, vino_id: vino.id, cantidad: 1, precio_unitario: 30 });
    const d2 = await addHistoryDetail({ movimiento_id: movimiento.id, vino_id: vino.id, cantidad: 3, precio_unitario: 40 });
    expect(d1).toHaveProperty('id');
    expect(d2).toHaveProperty('id');
    expect(d1.cantidad).toBe(1);
    expect(d2.cantidad).toBe(3);
  });

  afterAll(async () => {
    await pool.end();
  });
});
