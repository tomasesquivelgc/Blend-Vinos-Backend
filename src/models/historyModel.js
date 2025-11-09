import db from "../db.js";

export const addHistory = async ({
  vino_id,
  usuario_id,
  cliente_id = null,
  accion,
  cantidad = null,
  costo = null,
  comentario = null,
  vino_nombre = null,
  nombre_de_cliente = null
}) => {
  const query = `
    INSERT INTO historial 
    (vino_id, usuario_id, cliente_id, fecha, accion, cantidad, costo, comentario, vino_nombre, nombre_de_cliente)
    VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [vino_id, usuario_id, cliente_id, accion, cantidad, costo, comentario, vino_nombre, nombre_de_cliente];
  const { rows } = await db.query(query, values);
  return rows[0];
};
