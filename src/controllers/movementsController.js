import db from "../db.js";

export const registerMovement = async (req, res) => {
  const { wineId, type, quantity } = req.body;

  try {
    // Validate movement type
    if (type !== "BUY" && type !== "SELL") {
      return res.status(400).json({ error: "Invalid movement type" });
    }

    // Get current total stock
    const wineRes = await db.query("SELECT total FROM vinos WHERE id = $1", [wineId]);
    if (wineRes.rows.length === 0) {
      return res.status(404).json({ error: "Wine not found" });
    }

    let total = wineRes.rows[0].total;

    // Apply movement
    if (type === "BUY") {
      total += quantity;
    } else if (type === "SELL") {
      if (quantity > total) {
        return res.status(400).json({ error: "Not enough stock to sell" });
      }
      total -= quantity;
    }

    // Save movement in historial
    await db.query(
      `INSERT INTO historial (vino_id, accion, cantidad, fecha) 
       VALUES ($1, $2, $3, NOW())`,
      [wineId, type, quantity]
    );

    // Update wine stock (total)
    await db.query("UPDATE vinos SET total = $1 WHERE id = $2", [total, wineId]);

    res.json({ message: "Movement registered successfully", total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error registering movement" });
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