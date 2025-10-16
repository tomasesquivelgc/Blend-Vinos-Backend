import express from "express";
import { updateUser } from "../controllers/usersController.js";
import {authenticate, authorizeRoles} from "../middlewares/auth.js";
import { listUsers, deleteUser, getUserFromToken } from "../controllers/usersController.js";

const router = express.Router();

router.put("/:id", authenticate, updateUser);

// Admin-only
router.get("/", authenticate, authorizeRoles(1), listUsers);
router.delete("/:id", authenticate, authorizeRoles(1), deleteUser);
router.get("/me", authenticate, getUserFromToken);

export default router;
