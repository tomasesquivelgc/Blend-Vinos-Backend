import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../models/userModel.js';

export const register = async (req, res) => {
  try {
    // Get data from Postman (English names)
    const { name, roleId, email, password, username, phone } = req.body;

    // Check if user already exists
    const userExists = await findUserByEmail(email);
    if (userExists) return res.status(400).json({ message: "El usuario ya existe" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in DB (map English → Spanish)
    const user = await createUser({
      nombre: name,
      rol_id: roleId,
      email,
      contrasena: hashedPassword,
      nombreDeUsuario: username,
      telefono: phone
    });

    // Remove password before sending response
    delete user.contrasena;

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message, message: "Error al registrar usuario" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ message: "Credenciales inválidas" });

    const isMatch = await bcrypt.compare(password, user.contrasena);
    if (!isMatch) return res.status(400).json({ message: "Credenciales inválidas" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message, message: "Error al iniciar sesión" });
  }
};
