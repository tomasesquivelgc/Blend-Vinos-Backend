import db from "../db.js";

export const addHistoryDetail = async ({
  id,
  movimient_id,
  vino_id,
  cantidad,
  precio_unitario
}) => {
  const query = `
    INSERT INTO historial_detalle
    (id, movimient_id, vino_id, cantidad, precio_unitario)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [id, movimient_id, vino_id, cantidad, precio_unitario];
  const { rows } = await db.query(query, values);
  return rows[0];
};
