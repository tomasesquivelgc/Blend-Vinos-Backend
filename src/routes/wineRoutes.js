import express from 'express';
import { listWines, getWine } from '../controllers/wineController.js';

const router = express.Router();

// GET /wines → all wines
router.get('/', listWines);

// GET /wines/:id → single wine
router.get('/:id', getWine);

export default router;
