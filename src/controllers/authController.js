import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByNombreDeUsuario, findUserByEmail } from '../models/userModel.js';

export const register = async (req, res) => {
  try {
    // Get data from Postman (English names)
    const { name, roleId, email, password, username, phone } = req.body;

    // Check if user already exists
    const userByUsername = await findUserByNombreDeUsuario(username);
    if (userByUsername) {
        return res.status(400).json({ message: "El nombre de usuario ya está en uso" });
    }
    const userByEmail = await findUserByEmail(email);
    if (userByEmail) {
        return res.status(400).json({ message: "El correo electrónico ya está en uso" });
    }

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
    const { username, password } = req.body;

    const user = await findUserByNombreDeUsuario(username);
    if (!user) return res.status(400).json({ message: "Credenciales inválidas" });

    const isMatch = await bcrypt.compare(password, user.contrasena);
    if (!isMatch) return res.status(400).json({ message: "Credenciales inválidas" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({ 
      token,
      user: {
        id: user.id,
        rol_id: user.rol_id,
      }});
  } catch (error) {
    res.status(500).json({ error: error.message, message: "Error al iniciar sesión" });
  }
};
