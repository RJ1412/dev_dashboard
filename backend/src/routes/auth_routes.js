import express from "express";
import { register , login , logout , sendVerifyOtp ,verifyOtp } from "../controllers/controller_auth.js";
import {userAuth} from "../middleware/auth_middleware.js"

const authRoutes = express.Router();

authRoutes.post("/register" , register)

authRoutes.post("/login" , login)

authRoutes.post("/logout" , logout)

authRoutes.post("/send-verify-otp" , userAuth ,  sendVerifyOtp)

authRoutes.post("/verify-account" , userAuth ,  verifyOtp)





export default authRoutes;