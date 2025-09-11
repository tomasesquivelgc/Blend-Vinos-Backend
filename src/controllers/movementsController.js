import db from "../db.js";
import { addHistory } from "../models/historyModel.js";
import {getWineById} from "../models/wineModel.js";

export const registerMovement = async (req, res) => {
  try {
    const { wine_id, type, quantity, client_id = null, comment = null } = req.body;
    const usuario_id = req.user.id; // <-- comes from JWT (set in authenticate middleware)

    // Validate type
    if (!["COMPRA", "VENTA"].includes(type)) {
      return res.status(400).json({ error: "Tipo de transacción inválido" });
    }

    // Fetch wine
    const wine = await getWineById(wine_id);

    // Calculate cost
    let costo = parseFloat(wine.costo) * quantity;

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
      vino_nombre: wine.nombre
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