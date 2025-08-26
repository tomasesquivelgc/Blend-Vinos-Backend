import pool from '../db.js';

// Get all wines
export async function getAllWines() {
  const query = `SELECT * FROM vinos ORDER BY nombre`;
  const { rows } = await pool.query(query);
  return rows;
}

// Get wine by ID
export async function getWineById(id) {
  const query = `SELECT * FROM vinos WHERE id = $1`;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}
