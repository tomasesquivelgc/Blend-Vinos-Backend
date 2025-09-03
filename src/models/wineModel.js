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

export async function getWineByCodigoDeBarras(codigoDeBarras) {
  const query = `SELECT * FROM vinos WHERE codigoDeBarras = $1`;
  const { rows } = await pool.query(query, [codigoDeBarras]);
  return rows[0];
}

export async function getWineByCodigo(codigo) {
  const query = `SELECT * FROM vinos WHERE codigo = $1`;
  const { rows } = await pool.query(query, [codigo]);
  return rows[0];
}

// CREATE wine
export const createWine = async (wineData) => {
  const {
    codigoDeBarras,
    codigo,
    nombre,
    cepa,
    anejamiento,
    bodega,
    distribuidor,
    estilo,
    total,
    stockReal,
    costo
  } = wineData;

  const result = await pool.query(
    `INSERT INTO vinos 
      (codigoDeBarras, codigo, nombre, cepa, anejamiento, bodega, distribuidor, estilo, total, stockReal, costo)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [codigoDeBarras, codigo, nombre, cepa, anejamiento, bodega, distribuidor, estilo, total, stockReal, costo]
  );

  return result.rows[0];
};

// UPDATE wine
export const updateWine = async (id, wineData) => {
  const {
    codigoDeBarras,
    codigo,
    nombre,
    cepa,
    anejamiento,
    bodega,
    distribuidor,
    estilo,
    total,
    stockReal,
    costo
  } = wineData;

  const result = await pool.query(
    `UPDATE vinos
     SET codigoDeBarras=$1, codigo=$2, nombre=$3, cepa=$4, anejamiento=$5,
         bodega=$6, distribuidor=$7, estilo=$8, total=$9, stockReal=$10, costo=$11
     WHERE id=$12
     RETURNING *`,
    [codigoDeBarras, codigo, nombre, cepa, anejamiento, bodega, distribuidor, estilo, total, stockReal, costo, id]
  );

  return result.rows[0];
};

// DELETE wine
export const deleteWine = async (id) => {
  const result = await pool.query('DELETE FROM vinos WHERE id=$1 RETURNING *', [id]);
  return result.rows[0];
};