import express from "express";
import { updateUser } from "../controllers/usersController.js";
import {authenticate, authorizeRoles} from "../middlewares/auth.js";
import { listUsers } from "../controllers/usersController.js";

const router = express.Router();

router.put("/:id", authenticate, updateUser);

// Admin-only: list all users
router.get("/", authenticate, authorizeRoles(1), listUsers);

export default router;
