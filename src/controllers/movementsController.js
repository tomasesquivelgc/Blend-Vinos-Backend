import db from "../db.js";
import { addHistory } from "../models/historyModel.js";
import {getWineById} from "../models/wineModel.js";
import { findUserById } from "../models/userModel.js";

export const registerMovement = async (req, res) => {
  try {
    const { wine_id, type, quantity, client_id = null, comment = null, nombre_de_cliente = null } = req.body;
    const usuario_id = req.user.id; // <-- comes from JWT (set in authenticate middleware)

    // Validate type
    if (!["COMPRA", "VENTA"].includes(type)) {
      return res.status(400).json({ error: "Tipo de transacción inválido" });
    }

    // Fetch wine
    const wine = await getWineById(wine_id);

    // Determine unit price taking into account the client's role (if any)
    let unitPrice = parseFloat(wine.costo);
    if (client_id) {
      // Validate client exists and get their role
      const client = await findUserById(client_id);
      if (!client) {
        return res.status(400).json({ error: "Cliente no encontrado" });
      }

      // Apply role-based adjustments to the unit price
      if (client.rol_id === 2) unitPrice *= 1.06;      // Socio
      else if (client.rol_id === 3) unitPrice *= 1.22; // Revendedor
    }

    // Calculate total cost for the movement
    let costo = unitPrice * quantity;

    // Update stock
    let newTotal;
    if (type === "COMPRA") {
      newTotal = wine.total + quantity;
    } else {
      if (wine.total < quantity) {
        return res.status(400).json({ error: "No hay suficiente stock disponible" });
      }
      newTotal = wine.total - quantity;
    }

    // Update stockReal
    let newTotalReal;
    if (type === "COMPRA") {
      newTotalReal = wine.stockreal + quantity;
    } else {
      if (wine.stockreal < quantity) {
        return res.status(400).json({ error: "No hay suficiente stock real disponible" });
      }
      newTotalReal = wine.stockreal - quantity;
    }

    await db.query(`UPDATE vinos SET total = $1 WHERE id = $2`, [newTotal, wine_id]);
    await db.query(`UPDATE vinos SET stockreal = $1 WHERE id = $2`, [newTotalReal, wine_id]);

    // Add history record
    const history = await addHistory({
      vino_id: wine_id,
      usuario_id,         // taken from token
      cliente_id: client_id,
      accion: type,
      cantidad: quantity,
      costo: costo,
      comentario: comment,
      vino_nombre: wine.nombre,
      nombre_de_cliente: nombre_de_cliente
    });

    res.status(201).json({ message: "Transacción creada exitosamente", history });
  } catch (error) {
    console.error("Error creating movement:", error);
    res.status(500).json({ error: "Error al crear transacción" });
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
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query || {};

    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({ error: "Mes inválido. Debe ser 1-12" });
    }
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 3000) {
      return res.status(400).json({ error: "Año inválido" });
    }

    const query = `
      SELECT *
      FROM historial
      WHERE EXTRACT(YEAR FROM fecha) = $1
        AND EXTRACT(MONTH FROM fecha) = $2
      ORDER BY fecha DESC
    `;
    const result = await db.query(query, [parsedYear, parsedMonth]);

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
        TRIM(LOWER(vino_nombre)) AS vino_nombre,
        COUNT(*) AS cantidad_ventas,
        SUM(cantidad) AS botellas_vendidas,
        SUM(costo) AS total_dinero
      FROM historial
      WHERE accion ILIKE 'VENTA'
        AND fecha >= date_trunc('month', CURRENT_DATE)
        AND fecha < date_trunc('month', CURRENT_DATE + interval '1 month')
      GROUP BY TRIM(LOWER(vino_nombre))
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
