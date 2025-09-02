import db from "../db.js";
import { addHistory } from "../models/historyModel.js";

export const registerMovement = async (req, res) => {
  try {
    const { wine_id, type, quantity, client_id = null, comment = null } = req.body;
    const usuario_id = req.user.id; // <-- comes from JWT (set in authenticate middleware)

    // Validate type
    if (!["BUY", "SELL"].includes(type)) {
      return res.status(400).json({ error: "Invalid movement type" });
    }

    // Fetch wine
    const { rows } = await db.query(`SELECT * FROM vinos WHERE id = $1`, [wine_id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Wine not found" });
    }
    const wine = rows[0];

    // Calculate cost
    const costo = parseFloat(wine.costo) * quantity;

    // Update stock
    let newTotal;
    if (type === "BUY") {
      newTotal = wine.total + quantity;
    } else {
      if (wine.total < quantity) {
        return res.status(400).json({ error: "Not enough stock" });
      }
      newTotal = wine.total - quantity;
    }

    await db.query(`UPDATE vinos SET total = $1 WHERE id = $2`, [newTotal, wine_id]);

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

    res.status(201).json({ message: "Movement created successfully", history });
  } catch (error) {
    console.error("Error creating movement:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getMovements = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM historial ORDER BY fecha DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching movements" });
  }
};