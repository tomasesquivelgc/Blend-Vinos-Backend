import express from "express";
import { registerMovement, getMovements, registerRealStockMovement, getMovementsByMonth, getTopSoldWines, getMovementDetails, getAllMovementDetails } from "../controllers/movementsController.js";
import { authenticate, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// create a stock movement
router.post("/", authenticate, authorizeRoles(1), registerMovement);

// list all movements (admin only)
router.get("/", authenticate, authorizeRoles(1), getMovements);

// list movements by month (admin only)
router.get("/by-month", authenticate, authorizeRoles(1), getMovementsByMonth);

// register real stock adjustment (admin only)
router.post("/real-stock", authenticate, authorizeRoles(1), registerRealStockMovement);

// get top sold wines (admin only)
router.get("/top-sold", authenticate, authorizeRoles(1), getTopSoldWines);

// get movement details by ID (admin only)
router.get("/details/:id", authenticate, authorizeRoles(1), getMovementDetails);

// get all movement details (admin only)
router.get("/details", authenticate, authorizeRoles(1), getAllMovementDetails);

export default router;