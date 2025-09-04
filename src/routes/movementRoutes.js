import express from "express";
import { registerMovement, getMovements, registerRealStockMovement } from "../controllers/movementsController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// create a stock movement
router.post("/", authenticate, authorizeRoles(1), registerMovement);

// list all movements (admin only)
router.get("/", authenticate, authorizeRoles(1), getMovements);

// register real stock adjustment (admin only)
router.post("/real-stock", authenticate, authorizeRoles(1), registerRealStockMovement);

export default router;