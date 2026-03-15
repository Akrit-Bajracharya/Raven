// backend/src/routes/suggest.route.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getSuggestion } from "../controllers/suggest.controller.js";

const router = express.Router();
router.post("/", protectRoute, getSuggestion);
export default router;
