import express from 'express';
import { listWines, getWine } from '../controllers/wineController.js';
import {authenticate, authorizeRoles} from "../middlewares/auth.js";
import { addWine, editWine, removeWine } from '../controllers/wineController.js';

const router = express.Router();

// GET /wines → all wines
router.get('/', listWines);

// GET /wines/:id → single wine
router.get('/:id', getWine);

// POST /wines → create new wine
router.post('/', authenticate, authorizeRoles(1), addWine);

// PUT /wines/:id → update wine
router.put('/:id', authenticate, authorizeRoles(1), editWine);

// DELETE /wines/:id → delete wine
router.delete('/:id', authenticate, authorizeRoles(1), removeWine);

// GET /wines/:id → single wine
router.get('/:id', getWine);

export default router;
