import express from "express";
import { updateUser } from "../controllers/usersController.js";
import {authenticate} from "../middlewares/auth.js";

const router = express.Router();

router.put("/:id", authenticate, updateUser);

export default router;
