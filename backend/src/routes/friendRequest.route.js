import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
    sendRequest,
    acceptRequest,
    rejectRequest,
    getPendingRequests,
    getContacts,
    getRequestStatus,
} from "../controllers/friendRequest.controller.js";

const router = express.Router();

router.post("/send/:userId",       protectRoute, sendRequest);
router.post("/accept/:requestId",  protectRoute, acceptRequest);
router.post("/reject/:requestId",  protectRoute, rejectRequest);
router.get("/pending",             protectRoute, getPendingRequests);
router.get("/contacts",            protectRoute, getContacts);
router.get("/status/:userId",      protectRoute, getRequestStatus);

export default router;