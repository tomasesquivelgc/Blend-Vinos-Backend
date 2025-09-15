import request from 'supertest';
import app from '../../app.js'; // Adjust path if needed
import { usersData } from '../data/userTestData.js';
import pool from '../../db.js';
import { createUser } from '../../models/userModel.js';
import bcrypt from 'bcrypt';

describe('usersController', () => {
  let adminToken, user1Token, user2Token;
  let user1, user2;

  beforeEach(async () => {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM historial');
    await pool.query('DELETE FROM usuarios');

    // Create admin directly in DB with hashed password and login to get token
    const adminHashed = await bcrypt.hash(usersData[0].contrasena, 10);
    await createUser({ ...usersData[0], contrasena: adminHashed });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: usersData[0].nombreDeUsuario, password: usersData[0].contrasena });
    adminToken = adminLogin.body.token;

    // Register user1 and user2 via API as admin (ensures consistent hashing and response ids)
    const reg1 = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: usersData[1].nombre,
        roleId: usersData[1].rol_id,
        email: usersData[1].email,
        password: usersData[1].contrasena,
        username: usersData[1].nombreDeUsuario,
        phone: usersData[1].telefono
      });
    user1 = reg1.body;

    const reg2 = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: usersData[2].nombre,
        roleId: usersData[2].rol_id,
        email: usersData[2].email,
        password: usersData[2].contrasena,
        username: usersData[2].nombreDeUsuario,
        phone: usersData[2].telefono
      });
    user2 = reg2.body;

    // Login users to obtain their own tokens
    const u1Login = await request(app)
      .post('/api/auth/login')
      .send({ username: usersData[1].nombreDeUsuario, password: usersData[1].contrasena });
    user1Token = u1Login.body.token;

    const u2Login = await request(app)
      .post('/api/auth/login')
      .send({ username: usersData[2].nombreDeUsuario, password: usersData[2].contrasena });
    user2Token = u2Login.body.token;
  });

  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('lists all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(u => u.email === usersData[1].email)).toBe(true);
    expect(res.body.some(u => u.email === usersData[2].email)).toBe(true);
  });

  test('updates user info (self-update)', async () => {
    const res = await request(app)
      .put(`/api/users/${user1.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ nombre: 'Updated Name', telefono: '1111111111' });
    expect(res.statusCode).toBe(200);
    expect(res.body.nombre).toBe('Updated Name');
    expect(res.body.telefono).toBe('1111111111');
  });

  test('prevents updating another user', async () => {
    const res = await request(app)
      .put(`/api/users/${user2.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ nombre: 'Hacker' });
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/no autorizado/i);
  });

  test('deletes a user (admin can delete others)', async () => {
    const res = await request(app)
      .delete(`/api/users/${user2.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('userId', user2.id);
  });

  test('prevents user from deleting themselves', async () => {
    const res = await request(app)
      .delete(`/api/users/${user1.id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/Forbidden: insufficient permissions/i);
  });
});
