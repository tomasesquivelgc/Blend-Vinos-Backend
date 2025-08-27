import express from "express";
import { login, register } from "../controllers/authController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register",
  authenticate,
  authorizeRoles(1),
  register);

export default router;