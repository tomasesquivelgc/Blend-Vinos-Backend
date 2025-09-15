import {
  createUser,
  findUserByEmail,
  findUserByNombreDeUsuario,
  findUserById,
  getAllUsers,
  deleteUserById
} from '../models/userModel.js';
import { usersData } from './userTestData.js';
import pool from '../db.js';

describe('userModel', () => {
  let testUser, testUser2, testUser3;

  beforeEach(async () => {
    await pool.query('BEGIN');
    await pool.query('DELETE FROM historial');
    await pool.query('DELETE FROM usuarios');
    testUser = await createUser(usersData[0]);
    testUser2 = await createUser(usersData[1]);
    testUser3 = await createUser(usersData[2]);
  });

  afterEach(async () => {
    await pool.query('ROLLBACK');
  });

  afterAll(async () => {
    await pool.end();
  });

  test('createUser inserts a user and returns it', async () => {
    expect(testUser).toHaveProperty('id');
    expect(testUser.email).toBe(usersData[0].email);
  });

  test('findUserByEmail returns the correct user', async () => {
    const user = await findUserByEmail(usersData[1].email);
    expect(user).toBeDefined();
    expect(user.email).toBe(usersData[1].email);
  });

  test('findUserByNombreDeUsuario returns the correct user', async () => {
    const user = await findUserByNombreDeUsuario(usersData[2].nombreDeUsuario);
    expect(user).toBeDefined();
    // DB returns lowercase property
    expect(user.nombredeusuario || user.nombreDeUsuario).toBe(usersData[2].nombreDeUsuario);
  });

  test('findUserById returns the correct user', async () => {
    const user = await findUserById(testUser.id);
    expect(user).toBeDefined();
    expect(user.id).toBe(testUser.id);
  });

  test('getAllUsers returns all created users', async () => {
    const users = await getAllUsers();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThanOrEqual(3);
    const emails = users.map(u => u.email);
    expect(emails).toContain(usersData[0].email);
    expect(emails).toContain(usersData[1].email);
    expect(emails).toContain(usersData[2].email);
  });

  test('deleteUserById deletes the user and returns the deleted id', async () => {
    const deleted = await deleteUserById(testUser.id);
    expect(deleted).toBeDefined();
    expect(deleted.id).toBe(testUser.id);
    const shouldBeNull = await findUserById(testUser.id);
    expect(shouldBeNull).toBeUndefined();
  });
});
