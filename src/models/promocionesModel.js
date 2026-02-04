import pool from '../db.js';

/**
 * Buscar promoción por código
 * (solo activas)
 */
export const getPromocionByCodigo = async (codigo) => {
  const query = `
    SELECT *
    FROM promociones
    WHERE codigo = $1
      AND active = true
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [codigo]);
  return rows[0] || null;
};

/**
 * Obtener vinos de una promoción
 * con cantidades
 */
export const getVinosDePromocion = async (promocionId) => {
  const query = `
    SELECT
      v.id AS vino_id,
      v.codigo,
      v.nombre,
      v.total,
      v.costo,
      vp.cantidad
    FROM vinos_en_promocion vp
    JOIN vinos v ON v.id = vp.vino_id
    WHERE vp.promocion_id = $1
  `;

  const { rows } = await pool.query(query, [promocionId]);
  return rows;
};

/**
 * Crear promoción
 */
export const createPromocion = async ({ codigo, nombre, precio }) => {
  const query = `
    INSERT INTO promociones (codigo, nombre, precio)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const { rows } = await pool.query(query, [codigo, nombre, precio]);
  return rows[0];
};

/**
 * Agregar vino a promoción
 */
export const addVinoToPromocion = async ({
  promocion_id,
  vino_id,
  cantidad
}) => {
  const query = `
    INSERT INTO vinos_en_promocion (promocion_id, vino_id, cantidad)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const { rows } = await pool.query(query, [
    promocion_id,
    vino_id,
    cantidad
  ]);

  return rows[0];
};

/**
 * Desactivar promoción (soft delete)
 */
export const deactivatePromocion = async (promocionId) => {
  const query = `
    UPDATE promociones
    SET active = false
    WHERE id = $1
    RETURNING *
  `;

  const { rows } = await pool.query(query, [promocionId]);
  return rows[0];
};

/**
 * Obtener todas las promociones
 * (opcionalmente solo activas)
 */
export const getAllPromociones = async (soloActivas = true) => {
  let query = `
    SELECT *
    FROM promociones
  `;

  if (soloActivas) {
    query += ' WHERE active = true';
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Obtener todas las promociones con sus vinos
 */
export const getAllPromocionesConVinos = async (soloActivas = true) => {
  let query = `
    SELECT
      p.id AS promocion_id,
      p.codigo AS promocion_codigo,
      p.nombre AS promocion_nombre,
      p.precio,
      p.active,
      p.created_at,

      v.id AS vino_id,
      v.codigo AS vino_codigo,
      v.nombre AS vino_nombre,
      vp.cantidad
    FROM promociones p
    LEFT JOIN vinos_en_promocion vp
      ON vp.promocion_id = p.id
    LEFT JOIN vinos v
      ON v.id = vp.vino_id
  `;

  if (soloActivas) {
    query += ' WHERE p.active = true';
  }

  query += ' ORDER BY p.created_at DESC';

  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Reactivar promoción
 */
export const reactivatePromocion = async (promocionId) => {
  const query = `
    UPDATE promociones
    SET active = true
    WHERE id = $1
    RETURNING *
  `;
    const { rows } = await pool.query(query, [promocionId]);
    return rows[0];
};