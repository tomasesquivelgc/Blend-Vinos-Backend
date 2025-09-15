import request from 'supertest';
import app from '../../app.js'; // Adjust path if needed
import { usersData } from '../data/userTestData.js';
import { winesData } from '../data/wineTestData.js';
import pool from '../../db.js';
import { createUser } from '../../models/userModel.js';
import bcrypt from 'bcrypt';


describe('wineController', () => {
  let adminToken, wine;

  beforeEach(async () => {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM historial');
    await pool.query('DELETE FROM vinos');
    await pool.query('DELETE FROM usuarios');

    // Create admin directly with hashed password and login to get token
    const adminHashed = await bcrypt.hash(usersData[0].contrasena, 10);
    await createUser({ ...usersData[0], contrasena: adminHashed });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: usersData[0].nombreDeUsuario, password: usersData[0].contrasena });
    adminToken = loginRes.body.token;

    // Insert a wine for get/update/delete tests
    const res = await request(app)
      .post('/api/wines')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(winesData[0]);
    wine = res.body;
  });

  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('lists all wines', async () => {
    const res = await request(app)
      .get('/api/wines')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(w => w.nombre === winesData[0].nombre)).toBe(true);
  });

  test('lists wines paginated', async () => {
    // Add a second wine
    await request(app)
      .post('/api/wines')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(winesData[1]);
    const res = await request(app)
      .get('/api/wines/paginated?page=0&limit=1&order=ASC&orderBy=nombre')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  test('gets a wine by ID', async () => {
    const res = await request(app)
      .get(`/api/wines/${wine.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', wine.id);
    expect(res.body.nombre).toBe(winesData[0].nombre);
  });

  test('creates a new wine', async () => {
    const res = await request(app)
      .post('/api/wines')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(winesData[2]);
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.nombre).toBe(winesData[2].nombre);
  });

  test('updates a wine', async () => {
    const res = await request(app)
      .put(`/api/wines/${wine.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...winesData[0], nombre: 'Updated Wine', costo: 2000 });
    expect(res.statusCode).toBe(200);
    expect(res.body.nombre).toBe('Updated Wine');
    expect(Number(res.body.costo)).toBe(2000);
  });

  test('deletes a wine', async () => {
    const res = await request(app)
      .delete(`/api/wines/${wine.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.wine).toHaveProperty('id', wine.id);
  });

  test('returns 404 for non-existent wine', async () => {
    const res = await request(app)
      .get('/api/wines/999999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/no encontrado/i);
  });
});
