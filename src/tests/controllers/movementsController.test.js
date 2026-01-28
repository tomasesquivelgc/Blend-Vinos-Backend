import request from 'supertest';
import app from '../../app.js'; // Adjust path if needed
import { usersData } from '../data/userTestData.js';
import { winesData } from '../data/wineTestData.js';
import pool from '../../db.js';
import { createUser } from '../../models/userModel.js';
import bcrypt from 'bcrypt';


describe('movementsController', () => {
  let adminToken, wine, adminUser;

  beforeEach(async () => {
    // Clean child tables first to avoid FK issues and remove any prior test rows
    await pool.query('DELETE FROM movimiento_detalle');
    await pool.query('DELETE FROM historial');
    await pool.query('DELETE FROM vinos WHERE codigo = $1', [winesData[0].codigo]);
    await pool.query('DELETE FROM usuarios WHERE nombredeusuario = $1', [usersData[0].nombreDeUsuario]);

    // Create admin directly with hashed password and login to get token
    const adminHashed = await bcrypt.hash(usersData[0].contrasena, 10);
    adminUser = await createUser({ ...usersData[0], contrasena: adminHashed });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: usersData[0].nombreDeUsuario, password: usersData[0].contrasena });
    adminToken = loginRes.body.token;

    // Create a wine via API (protected route)
    const wineRes = await request(app)
      .post('/api/wines')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(winesData[0]);
    wine = wineRes.body;
  });

  afterEach(async () => {});

  afterAll(async () => {
    await pool.end();
  });

  test('registers a purchase (COMPRA) movement', async () => {
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        wine_id: [wine.id],
        type: 'COMPRA',
        quantity: [10],
        comment: 'Test purchase'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.history).toHaveProperty('accion', 'COMPRA');
    expect(res.body.history.vino_id).toBe(wine.id);
    expect(res.body.history.usuario_id).toBe(adminUser.id);
  });

  test('registers a sale (VENTA) movement', async () => {
    // First, add stock so sale is possible
    await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        wine_id: [wine.id],
        type: 'COMPRA',
        quantity: [10],
        comment: 'Initial stock'
      });
    // Now, register sale
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        wine_id: [wine.id],
        type: 'VENTA',
        quantity: [5],
        comment: 'Test sale'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body.history).toHaveProperty('accion', 'VENTA');
    expect(res.body.history.vino_id).toBe(wine.id);
    expect(res.body.history.usuario_id).toBe(adminUser.id);
  });

  test('fails to register sale if not enough stock', async () => {
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        wine_id: [wine.id],
        type: 'VENTA',
        quantity: [9999],
        comment: 'Too much'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/stock/i);
  });

  test('rejects invalid movement type', async () => {
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wine_id: [wine.id], type: 'INVALID', quantity: [1] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/Tipo de transacci/i);
  });

  test('rejects non-array wine_id or quantity', async () => {
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wine_id: wine.id, type: 'COMPRA', quantity: [1] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/wine_id y quantity deben ser arrays/i);
  });

  test('rejects mismatched wine_id and quantity lengths', async () => {
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wine_id: [wine.id, wine.id], type: 'COMPRA', quantity: [1] });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/misma longitud/i);
  });

  test('client id not found returns error', async () => {
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wine_id: [wine.id], type: 'COMPRA', quantity: [1], client_id: 999999 });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toMatch(/Cliente no encontrado/i);
  });

  test('applies role multiplier for client role 2', async () => {
    // create a client user with role 2
    const clientHashed = await bcrypt.hash(usersData[1].contrasena, 10);
    const unique = Date.now();
    const clientUser = await createUser({ ...usersData[1], contrasena: clientHashed, email: `bob+${unique}@example.com`, nombreDeUsuario: `bobuser_${unique}` });
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wine_id: [wine.id], type: 'COMPRA', quantity: [1], client_id: clientUser.id });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  test('registerRealStockMovement invalid type', async () => {
    const res = await request(app)
      .post('/api/movements/real-stock')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wine_id: wine.id, type: 'BAD', quantity: 5 });
    expect(res.statusCode).toBe(400);
  });

  test('registerRealStockMovement AGREGAR works', async () => {
    const res = await request(app)
      .post('/api/movements/real-stock')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wine_id: wine.id, type: 'AGREGAR', quantity: 2, comment: 'Add stock' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('history');
    expect(res.body.history).toHaveProperty('id');
  });

  test('getMovements returns array', async () => {
    const res = await request(app)
      .get('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('getMovementsByMonth validates month/year and returns data', async () => {
    const bad1 = await request(app)
      .get('/api/movements/by-month?month=13')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(bad1.statusCode).toBe(400);

    const bad2 = await request(app)
      .get('/api/movements/by-month?year=100')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(bad2.statusCode).toBe(400);

    const ok = await request(app)
      .get('/api/movements/by-month')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(ok.statusCode).toBe(200);
    expect(Array.isArray(ok.body)).toBe(true);
  });

  test('getTopSoldWines, getMovementDetails, getAllMovementDetails', async () => {
    // create a movement to ensure details exist
    const mv = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ wine_id: [wine.id], type: 'COMPRA', quantity: [3] });
    expect(mv.statusCode).toBe(201);
    const movimientoId = mv.body.history.id || mv.body.history.movimiento_id;

    const top = await request(app)
      .get('/api/movements/top-sold')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(top.statusCode).toBe(200);
    expect(Array.isArray(top.body)).toBe(true);

    const details = await request(app)
      .get(`/api/movements/details/${movimientoId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(details.statusCode).toBe(200);
    expect(Array.isArray(details.body)).toBe(true);

    const allDetails = await request(app)
      .get('/api/movements/details')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(allDetails.statusCode).toBe(200);
    expect(Array.isArray(allDetails.body)).toBe(true);
  });
});
