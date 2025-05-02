import express from "express";
import { userProfile } from "../controllers/controller_cf.js";
const CfRoutes = express.Router();

CfRoutes.get("/userProfile" , userProfile)

export default CfRoutes;