import {
  getPromocionByCodigo,
  getVinosDePromocion,
  deactivatePromocion,
  getAllPromocionesConVinos,
  reactivatePromocion
} from '../models/promocionesModel.js';
import db from '../db.js';
import pool from '../db.js';

/**
 * Crear una promoción
 */
export const crearPromocion = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      codigo,
      nombre,
      precio,
      vinos,
      cantidades
    } = req.body;

    // Validaciones básicas
    if (!codigo || !nombre || precio == null) {
      return res.status(400).json({
        error: 'codigo, nombre y precio son obligatorios'
      });
    }

    if (
      !Array.isArray(vinos) ||
      !Array.isArray(cantidades) ||
      vinos.length !== cantidades.length
    ) {
      return res.status(400).json({
        error: 'vinos y cantidades deben ser arrays del mismo tamaño'
      });
    }

    await client.query('BEGIN');

    // 1️⃣ Crear promoción
    const promocionQuery = `
      INSERT INTO promociones (codigo, nombre, precio)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const { rows } = await client.query(promocionQuery, [
      codigo,
      nombre,
      precio
    ]);

    const promocion = rows[0];

    // 2️⃣ Insertar vinos asociados
    for (let i = 0; i < vinos.length; i++) {
      const vinoId = vinos[i];
      const cantidad = cantidades[i];

      if (cantidad <= 0) {
        throw new Error('Cantidad inválida');
      }

      const relacionQuery = `
        INSERT INTO vinos_en_promocion (promocion_id, vino_id, cantidad)
        VALUES ($1, $2, $3)
      `;

      await client.query(relacionQuery, [
        promocion.id,
        vinoId,
        cantidad
      ]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      ...promocion,
      vinos: vinos.map((vinoId, index) => ({
        vino_id: vinoId,
        cantidad: cantidades[index]
      }))
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);

    res.status(500).json({
      error: 'Error al crear la promoción'
    });
  } finally {
    client.release();
  }
};

/**
 * Obtener promoción por código
 * (incluye vinos asociados)
 */
export const obtenerPromocionPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const promocion = await getPromocionByCodigo(codigo);

    if (!promocion) {
      return res.status(404).json({
        error: 'Promoción no encontrada'
      });
    }

    const vinos = await getVinosDePromocion(promocion.id);

    res.json({
      ...promocion,
      vinos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la promoción' });
  }
};

/**
 * actualizar promoción
 */
export const editarPromocion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { codigo, nombre, vinos, cantidades } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({
        error: 'codigo y nombre son obligatorios'
      });
    }

    if (
      !Array.isArray(vinos) ||
      !Array.isArray(cantidades) ||
      vinos.length !== cantidades.length
    ) {
      return res.status(400).json({
        error: 'vinos y cantidades deben ser arrays del mismo tamaño'
      });
    }

    await client.query('BEGIN');

    // 1️⃣ Update datos básicos
    const updatePromoQuery = `
      UPDATE promociones
      SET codigo = $1,
          nombre = $2
      WHERE id = $3
      RETURNING *
    `;

    const { rows } = await client.query(updatePromoQuery, [
      codigo,
      nombre,
      id
    ]);

    if (rows.length === 0) {
      throw new Error('Promoción no encontrada');
    }

    const promocion = rows[0];

    // 2️⃣ Borrar relaciones anteriores
    await client.query(
      'DELETE FROM vinos_en_promocion WHERE promocion_id = $1',
      [id]
    );

    // 3️⃣ Insertar nuevas relaciones
    for (let i = 0; i < vinos.length; i++) {
      const vinoId = vinos[i];
      const cantidad = cantidades[i];

      if (cantidad <= 0) {
        throw new Error('Cantidad inválida');
      }

      await client.query(
        `
        INSERT INTO vinos_en_promocion (promocion_id, vino_id, cantidad)
        VALUES ($1, $2, $3)
        `,
        [id, vinoId, cantidad]
      );
    }

    await client.query('COMMIT');

    res.json({
      ...promocion,
      vinos: vinos.map((vinoId, index) => ({
        vino_id: vinoId,
        cantidad: cantidades[index]
      }))
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);

    res.status(500).json({
      error: 'Error al editar la promoción'
    });
  } finally {
    client.release();
  }
};

/**
 * Desactivar promoción
 */
export const desactivarPromocion = async (req, res) => {
  try {
    const { id } = req.params;

    const promocion = await deactivatePromocion(id);

    if (!promocion) {
      return res.status(404).json({
        error: 'Promoción no encontrada'
      });
    }

    res.json(promocion);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error al desactivar la promoción'
    });
  }
};

/**
 * Obtener todas las promociones con sus vinos
 */
export const obtenerTodasLasPromociones = async (req, res) => {
  try {
    const { all } = req.query;
    const soloActivas = all !== 'true';

    const rows = await getAllPromocionesConVinos(soloActivas);

    const promocionesMap = new Map();

    for (const row of rows) {
      const promoId = row.promocion_id;

      if (!promocionesMap.has(promoId)) {
        promocionesMap.set(promoId, {
          id: promoId,
          codigo: row.promocion_codigo,
          nombre: row.promocion_nombre,
          precio: row.precio,
          active: row.active,
          created_at: row.created_at,
          vinos: []
        });
      }

      if (row.vino_id) {
        promocionesMap.get(promoId).vinos.push({
          id: row.vino_id,
          codigo: row.vino_codigo,
          nombre: row.vino_nombre,
          cantidad: row.cantidad
        });
      }
    }

    res.json([...promocionesMap.values()]);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: 'Error al obtener las promociones'
    });
  }
};

/**
 * Reactivar promoción
 */
export const reactivarPromocion = async (req, res) => {
  try {
    const { id } = req.params;
    const promocion = await reactivatePromocion(id);

    if (!promocion) {
        return res.status(404).json({
        error: 'Promoción no encontrada'
      });
    }
    res.json(promocion);
  } catch (error) {
    console.error(error);
    res.status(500).json({
        error: 'Error al reactivar la promoción'
    });
  }
};