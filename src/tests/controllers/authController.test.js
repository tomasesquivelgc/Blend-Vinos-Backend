import request from 'supertest';
import app from '../../app.js'; // Adjust path if needed
import { usersData } from '../data/userTestData.js';
import pool from '../../db.js';
import { createUser } from '../../models/userModel.js';
import bcrypt from 'bcrypt';

describe('authController', () => {
  let adminToken;

  beforeEach(async () => {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM historial');
    await pool.query('DELETE FROM usuarios');

    // Create admin user directly in DB with hashed password
    const hashed = await bcrypt.hash(usersData[0].contrasena, 10);
    await createUser({
      ...usersData[0],
      contrasena: hashed
    });

    // Login as admin to obtain token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: usersData[0].nombreDeUsuario,
        password: usersData[0].contrasena
      });
    adminToken = loginRes.body.token;
  });

  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('registers a new user as admin', async () => {
    const res = await request(app)
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
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(usersData[1].email);
  });

  test('does not allow duplicate username', async () => {
    // Register user with username
    await request(app)
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
    // Try to register with same username but different email
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: usersData[2].nombre,
        roleId: usersData[2].rol_id,
        email: 'unique@example.com',
        password: usersData[2].contrasena,
        username: usersData[1].nombreDeUsuario,
        phone: usersData[2].telefono
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/nombre de usuario/i);
  });

  test('does not allow duplicate email', async () => {
    // Register user with email
    await request(app)
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
    // Try to register with same email but different username
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: usersData[2].nombre,
        roleId: usersData[2].rol_id,
        email: usersData[1].email,
        password: usersData[2].contrasena,
        username: usersData[2].nombreDeUsuario,
        phone: usersData[2].telefono
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/correo/i);
  });

  test('logs in a registered user', async () => {
    // Register user first (as admin)
    await request(app)
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
    // Now login
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: usersData[1].nombreDeUsuario,
        password: usersData[1].contrasena
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('does not log in with invalid credentials', async () => {
    // Register user first (as admin)
    await request(app)
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
    // Try to login with wrong password
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: usersData[1].nombreDeUsuario,
        password: 'wrongpassword'
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/credenciales/i);
  });
});
