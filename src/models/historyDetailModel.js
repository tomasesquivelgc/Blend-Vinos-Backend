import db from "../db.js";

export const addHistoryDetail = async ({
  id,
  movimiento_id,
  vino_id,
  cantidad,
  precio_unitario
}) => {
  const query = `
    INSERT INTO historial_detalle
    (id, movimiento_id, vino_id, cantidad, precio_unitario)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [id, movimiento_id, vino_id, cantidad, precio_unitario];
  const { rows } = await db.query(query, values);
  return rows[0];
};
