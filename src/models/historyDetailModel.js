import db from "../db.js";

export const addHistoryDetail = async ({
  movimiento_id,
  vino_id,
  cantidad,
  precio_unitario
}) => {
  const query = `
    INSERT INTO movimiento_detalle
    (movimiento_id, vino_id, cantidad, precio_unitario)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const values = [movimiento_id, vino_id, cantidad, precio_unitario];
  const { rows } = await db.query(query, values);
  return rows[0];
};
