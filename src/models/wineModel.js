import pool from '../db.js';

// Get all wines
export async function getAllWines() {
  const query = `SELECT * FROM vinos ORDER BY nombre`;
  const { rows } = await pool.query(query);
  return rows;
}

// Get all wines paginated and ordered by nombre, cepa, anejamiento, bodega, distribuidor, estilo in ASC or DESC
export async function getAllWinesPaginated(page, limit, order, orderBy) {
  // Ensure page and limit are numbers and have defaults
  const pageNum = Number.isInteger(page) && page >= 0 ? page : 0;
  const limitNum = Number.isInteger(limit) && limit > 0 ? limit : 10;

  // Set default values for order and orderBy
  const validOrders = ["ASC", "DESC"];
  const sortOrder = validOrders.includes((order || "").toUpperCase()) ? order.toUpperCase() : "ASC";
  const allowedColumns = ["nombre", "cepa", "anejamiento", "bodega", "distribuidor", "estilo", "costo", "total"];
  const sortBy = allowedColumns.includes(orderBy) ? orderBy : "nombre";

  const query = `SELECT * FROM vinos ORDER BY ${sortBy} ${sortOrder} LIMIT $1 OFFSET $2`;
  const { rows } = await pool.query(query, [limitNum, pageNum * limitNum]);
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

export async function getWineByNombre(nombre) {
  const query = `SELECT * FROM vinos WHERE LOWER(nombre) = LOWER($1)`;
  const { rows } = await pool.query(query, [nombre]);
  return rows;
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

export async function getWineByNombrePartial(name) {
  const query = `
    SELECT * FROM vinos 
    WHERE LOWER(nombre) LIKE LOWER($1)
  `;
  const { rows } = await pool.query(query, [`%${name}%`]);
  return rows;
}

export async function getWineByCepa(cepa) {
  const query = `
    SELECT * FROM vinos
    WHERE LOWER(cepa) LIKE LOWER($1)
  `;
  const { rows } = await pool.query(query, [`%${cepa}%`]);
  return rows;
}