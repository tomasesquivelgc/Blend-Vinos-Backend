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
    await pool.query('BEGIN');
    await pool.query('DELETE FROM historial');
    await pool.query('DELETE FROM vinos');
    await pool.query('DELETE FROM usuarios');

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

  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('registers a purchase (COMPRA) movement', async () => {
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        wine_id: wine.id,
        type: 'COMPRA',
        quantity: 10,
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
        wine_id: wine.id,
        type: 'COMPRA',
        quantity: 10,
        comment: 'Initial stock'
      });
    // Now, register sale
    const res = await request(app)
      .post('/api/movements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        wine_id: wine.id,
        type: 'VENTA',
        quantity: 5,
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
        wine_id: wine.id,
        type: 'VENTA',
        quantity: 9999,
        comment: 'Too much'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/stock/i);
  });
});
