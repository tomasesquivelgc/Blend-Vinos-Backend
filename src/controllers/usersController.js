import bcrypt from "bcrypt";
import db from "../db.js";
import { getAllUsers, deleteUserById } from "../models/userModel.js";

// map frontend English → DB Spanish
const fieldMap = {
  name: "nombre",
  email: "email",
  password: "contrasena",
  username: "nombreDeUsuario",
  phone: "telefono",
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // prevent editing other users
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this user" });
    }

    const updates = {};
    for (const [frontendField, dbField] of Object.entries(fieldMap)) {
      if (req.body[frontendField]) {
        updates[dbField] = req.body[frontendField];
      }
    }

    // hash password if changed
    if (updates.contrasena) {
      updates.contrasena = await bcrypt.hash(updates.contrasena, 10);
    }

    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return res.status(400).json({ message: "No data to update" });
    }

    values.push(id);
    const sql = `
      UPDATE usuarios
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, nombre AS name, email, nombreDeUsuario AS username, telefono AS phone, rol_id AS roleId
    `;

    const result = await db.query(sql, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating user" });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // prevent admins from deleting themselves if you want
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Admins cannot delete themselves" });
    }

    const deleted = await deleteUserById(id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully", userId: deleted.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting user" });
  }
};