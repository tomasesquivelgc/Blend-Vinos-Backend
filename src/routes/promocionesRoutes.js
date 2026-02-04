import express from "express";
import { crearPromocion, editarPromocion, desactivarPromocion, obtenerTodasLasPromociones, reactivarPromocion } from "../controllers/promocionesController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// Crear una nueva promoción (admin only)
router.post("/", authenticate, authorizeRoles(1), crearPromocion);

// Actualizar una promoción (admin only)
router.put("/:id", authenticate, authorizeRoles(1), editarPromocion);

// Desactivar una promoción (admin only)
router.delete("/:id", authenticate, authorizeRoles(1), desactivarPromocion);

// Obtener todas las promociones con sus vinos
router.get("/", authenticate, obtenerTodasLasPromociones);

// Reactivar una promoción (admin only)
router.post("/reactivar/:id", authenticate, authorizeRoles(1), reactivarPromocion);

export default router;