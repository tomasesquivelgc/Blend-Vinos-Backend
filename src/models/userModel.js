// models/userModel.js
import pool from '../db.js';


  export async function createUser({ nombre, rol_id, email, contrasena, nombreDeUsuario, telefono }) {
    const query = `
      INSERT INTO usuarios (nombre, rol_id, email, contrasena, nombreDeUsuario, telefono)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [nombre, rol_id, email, contrasena, nombreDeUsuario, telefono];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  export async function findUserByEmail(email) {
    const query = `SELECT * FROM usuarios WHERE email = $1`;
    const { rows } = await pool.query(query, [email]);
    return rows[0];
  }

  export async function findByNombreDeUsuario(nombreDeUsuario) {
    const query = `SELECT * FROM usuarios WHERE "nombreDeUsuario" = $1`;
    const { rows } = await pool.query(query, [nombreDeUsuario]);
    return rows[0];
  }

  export async function findUserById(id) {
    const query = `SELECT * FROM usuarios WHERE id = $1`;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }


export async function getAllUsers() {
  const query = `
    SELECT 
      id, 
      nombre AS name, 
      rol_id AS roleId, 
      email, 
      nombreDeUsuario AS username, 
      telefono AS phone
    FROM usuarios
    ORDER BY id;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

export async function deleteUserById(id) {
  const query = `DELETE FROM usuarios WHERE id = $1 RETURNING id;`;
  const { rows } = await pool.query(query, [id]);
  return rows[0]; // returns null if no user was deleted
}