import db from "../db.js";
import { addHistory } from "../models/historyModel.js";
import {getWineByCodigo} from "../models/wineModel.js";
import { findUserById } from "../models/userModel.js";
import { addHistoryDetail } from "../models/historyDetailModel.js";

export const registerMovement = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      wine_id,          // ← en realidad SON CÓDIGOS (array de strings)
      quantity,         // array de numbers
      type,
      client_id = null,
      comment = null,
      nombre_de_cliente = null
    } = req.body;
    const usuario_id = req.user.id;

    // --- Basic validations ---
    if (!["COMPRA", "VENTA"].includes(type)) {
      return res.status(400).json({ error: "Tipo de transacción inválido" });
    }
    if (!Array.isArray(wine_id) || !Array.isArray(quantity)) {
      return res.status(400).json({ error: "wine_id y quantity deben ser arrays" });
    }

    if (wine_id.length !== quantity.length) {
      return res.status(400).json({ error: "wine_id y quantity deben tener la misma longitud" });
    }

    await client.query("BEGIN");

    // --- Fetch client role once ---
    let roleMultiplier = 1;
    if (client_id) {
      const clientUser = await findUserById(client_id);
      if (!clientUser) {
        throw new Error("Cliente no encontrado");
      }

      // Apply role-based adjustments to the unit price
      if (client.rol_id === 2) unitPrice *= 1.08;      // Socio
      else if (client.rol_id === 3) unitPrice *= 1.22; // Revendedor
      else if (req.user.rol_id === 4) precio *= 1.15;  // Distribuidor
      else if (req.user.rol_id === 5) precio *= 1.3; // Revendedor Socio
    }

    let costoTotal = 0;

    // clave: wineId REAL → data
    const wineCache = {};

    // --- Validate stock & calculate totals ---
    for (let i = 0; i < wine_id.length; i++) {
      const wineCode = wine_id[i]; // ← ES UN CÓDIGO
      const qty = quantity[i];

      if (qty <= 0) {
        throw new Error("Cantidad inválida");
      }

      const wineRes = await client.query(
        `SELECT * FROM vinos WHERE codigo = $1 AND activo = true`,
        [wineCode]
      );

      const wine = wineRes.rows[0];
      if (!wine) {
        throw new Error(`Vino ${wineCode} no encontrado`);
      }

      if (type === "VENTA" && wine.total < qty) {
        throw new Error(`Stock insuficiente para ${wine.nombre}`);
      }

      const unitPrice = parseFloat(wine.costo) * roleMultiplier;
      costoTotal += unitPrice * qty;

      // usar SIEMPRE el ID real de la DB
      if (wineCache[wine.id]) {
        // por seguridad, si llega duplicado desde frontend
        wineCache[wine.id].qty += qty;
      } else {
        wineCache[wine.id] = {
          wine,
          unitPrice,
          qty
        };
      }
    }

    // --- Insert master movement ---
    const movimientoRes = await client.query(
      `INSERT INTO historial
        (usuario_id, cliente_id, fecha, accion, costo, comentario, nombre_de_cliente)
       VALUES ($1,$2,NOW(),$3,$4,$5,$6)
       RETURNING *`,
      [usuario_id, client_id, type, costoTotal, comment, nombre_de_cliente]
    );

    const movimiento = movimientoRes.rows[0];

    // --- Update stock + insert details ---
    for (const [wineId, data] of Object.entries(wineCache)) {
      const { wine, unitPrice, qty } = data;

      const newTotal =
        type === "COMPRA"
          ? wine.total + qty
          : wine.total - qty;

      const newTotalReal =
        type === "COMPRA"
          ? wine.stockreal + qty
          : wine.stockreal - qty;

      await client.query(
        `UPDATE vinos
         SET total = $1, stockreal = $2
         WHERE id = $3`,
        [newTotal, newTotalReal, wineId]
      );

      await client.query(
        `INSERT INTO movimiento_detalle
          (movimiento_id, vino_id, cantidad, precio_unitario)
         VALUES ($1,$2,$3,$4)`,
        [movimiento.id, wineId, qty, unitPrice]
      );
    }

    await client.query("COMMIT");

    // compat tests legacy
    const responseHistory = {
      ...movimiento,
      vino_id: Object.keys(wineCache)[0]
    };

    res.status(201).json({
      message: "Transacción creada exitosamente",
      history: responseHistory
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating movement:", error);

    const msg = error.message || "Error al crear transacción";

    if (
      msg.toLowerCase().includes("stock insuficiente") ||
      msg.toLowerCase().includes("cantidad inválida")
    ) {
      return res.status(400).json({ error: msg });
    }

    if (msg.toLowerCase().includes("no encontrado")) {
      return res.status(404).json({ error: msg });
    }

    res.status(500).json({ error: msg });
  } finally {
    client.release();
  }
};



export const registerRealStockMovement = async (req, res) => {
  try{
    const { wine_id, type, quantity, comment = null } = req.body;
    const usuario_id = req.user.id;

    // Validate type
    if (!["AGREGAR", "REMOVER"].includes(type)) {
      return res.status(400).json({ error: "Tipo de transacción inválido" });
    }

    // Fetch wine
    const wine = await getWineById(wine_id);

    // Calculate cost
    let costo = parseFloat(wine.costo) * quantity;

    // Update realStock
    let newTotalStock;
    if (type === "AGREGAR") {
      newTotalStock = wine.stockreal + quantity;
    } else {
      newTotalStock = wine.stockreal - quantity;
    }

    await db.query(`UPDATE vinos SET stockreal = $1 WHERE id = $2`, [newTotalStock, wine_id]);

    // Add history record
    const history = await addHistory({
      vino_id: wine_id,
      usuario_id,
      accion: type,
      cantidad: quantity,
      costo: costo,
      comentario: comment,
      vino_nombre: wine.nombre
    });

    res.status(201).json({ message: "Transacción de stock real creada exitosamente", history });
  } catch (error) {
    console.error("Error creating real stock movement:", error);
    res.status(500).json({ error: "Error al crear transacción de stock real" });
  }
};

export const getMovements = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM historial ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener transacciones" });
  }
};

export const getMovementsByMonth = async (req, res) => {
  try {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear(), accion } = req.query || {};

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ error: "Mes inválido. Debe ser 1-12" });
    }
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 3000) {
      return res.status(400).json({ error: "Año inválido" });
    }

    const allowed = ['COMPRA','VENTA','CREAR','ACTUALIZAR','ELIMINAR'];
    const params = [parsedYear, parsedMonth];
    let whereExtra = '';
    if (accion != null && String(accion).trim() !== '') {
      const accionUpper = String(accion).toUpperCase();
      if (!allowed.includes(accionUpper)) {
        return res.status(400).json({ error: 'Tipo de movimiento inválido' });
      }
      whereExtra = ' AND accion = $3';
      params.push(accionUpper);
    }

    const query = `
      SELECT *
      FROM historial
      WHERE EXTRACT(YEAR FROM fecha) = $1
        AND EXTRACT(MONTH FROM fecha) = $2
        ${whereExtra}
      ORDER BY fecha DESC
    `;
    const result = await db.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener transacciones por mes" });
  }
};

export const getTopSoldWines = async (req, res) => {
  try {
    const query = `
      SELECT
        TRIM(LOWER(v.nombre)) AS vino_nombre,
        COUNT(DISTINCT h.id) AS cantidad_ventas,
        SUM(md.cantidad) AS botellas_vendidas,
        SUM(md.cantidad * md.precio_unitario) AS total_dinero
      FROM historial h
      JOIN movimiento_detalle md
        ON md.movimiento_id = h.id
      JOIN vinos v
        ON v.id = md.vino_id
      WHERE h.accion = 'VENTA'
        AND h.fecha >= date_trunc('month', CURRENT_DATE)
        AND h.fecha < date_trunc('month', CURRENT_DATE + interval '1 month')
      GROUP BY TRIM(LOWER(v.nombre))
      ORDER BY botellas_vendidas DESC, cantidad_ventas DESC
      LIMIT 5;
    `;

    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los vinos más vendidos" });
  }
};


export const getMovementDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT *
      FROM movimiento_detalle
      WHERE movimiento_id = $1
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los detalles de la transacción" });
  }
};

export const getAllMovementDetails = async (req, res) => {
  try {
    const query = `
      SELECT *
      FROM movimiento_detalle
    `;
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener los detalles de las transacciones" });
  }
};