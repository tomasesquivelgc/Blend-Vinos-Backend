import bcrypt from "bcrypt";
import db from "../db.js";
import { getAllUsers, deleteUserById } from "../models/userModel.js";

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // prevent editing other users
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ message: "No autorizado para modificar este usuario" });
    }

    const campos = ["nombre", "email", "contrasena", "nombreDeUsuario", "telefono"];
    const updates = {};
    for (const campo of campos) {
      if (req.body[campo]) {
        updates[campo] = req.body[campo];
      }
    }

    // hash password if changed
    if (updates.contrasena) {
      updates.contrasena = await bcrypt.hash(updates.contrasena, 10);
    }

    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 1}`);
    const values = Object.values(updates);

    if (fields.length === 0) {
      return res.status(400).json({ message: "No hay datos para actualizar" });
    }

    values.push(id);
    const sql = `
      UPDATE usuarios
      SET ${fields.join(", ")}
      WHERE id = $${values.length}
      RETURNING id, nombre, email, nombreDeUsuario, telefono, rol_id AS roleId
    `;

    const result = await db.query(sql, values);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al actualizar usuario" });
  }
};

export const listUsers = async (req, res) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // prevent admins from deleting themselves if you want
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: "Los administradores no pueden eliminarse a sí mismos" });
    }

    const deleted = await deleteUserById(id);

    if (!deleted) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario eliminado exitosamente", userId: deleted.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al eliminar usuario" });
  }
};

export const getUserFromToken = async (req, res) => {
  try {
    // The middleware already validated and decoded the token
    const userId = req.user.id;

    const sql = `
      SELECT id, nombre, email, nombreDeUsuario, telefono, rol_id AS roleId
      FROM usuarios
      WHERE id = $1
    `;
    const result = await db.query(sql, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al obtener datos del usuario" });
  }
};