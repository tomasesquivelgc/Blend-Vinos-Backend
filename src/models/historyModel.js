import db from "../db.js";

export const addHistory = async ({
  usuario_id,
  cliente_id = null,
  accion,
  costo,
  comentario = null,
  nombre_de_cliente = null
}) => {
  const query = `
    INSERT INTO historial 
    (usuario_id, cliente_id, fecha, accion, costo, comentario, nombre_de_cliente)
    VALUES ($1, $2, NOW(), $3, $4, $5, $6)
    RETURNING *;
  `;

  const values = [usuario_id, cliente_id, accion, costo, comentario, nombre_de_cliente];
  const { rows } = await db.query(query, values);
  return rows[0];
};
