import { db } from "../libs/db.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import transporter from "../libs/nodemailer.js";
import crypto from "crypto";
dotenv.config();

// Register a new user
export const register = async (req, res) => {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password || !name) {
        return res.status(400).json({
            error: "All fields required"
        });
    }

    try {
        const existingUser = await db.user.findUnique({
            where: {
                email
            }
        });

        if (existingUser) {
            return res.status(400).json({
                error: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                name
            }
        });

        const token = jwt.sign(
            { id: newUser.username, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("jwt", token, {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development",
            maxAge: 1000 * 60 * 60 * 24 * 7
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to DevDashboard',
            text: `Welcome ${name} Your registered email is ${email} , Kindly Verify it`
        };

        await transporter.sendMail(mailOptions);
        res.status(201).json({
            success: true,
            message: "User Created Successfully",
            user: {
                id: newUser.username,
                username: newUser.username,
                email: newUser.email,
                name: newUser.name,
                image: newUser.image
            }
        });
    } catch (error) {
        console.log("Error creating user:", error);
        res.status(500).json({
            error: "Error creating user"
        });
    }
};

// Login user
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            error: "All Fields Required"
        });
    }

    try {
        const user = await db.user.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            return res.status(400).json({
                error: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                error: "Invalid Credentials"
            });
        }

        if (!user.IsVerified) {
            const otp = String(Math.floor(100000 + Math.random() * 900000));

            await db.user.update({
                where: { email },
                data: {
                    VerificationToken: otp,
                    VerifyOtpExpireAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                },
            });

            const mailOptions = {
                from: process.env.SENDER_EMAIL,
                to: email,
                subject: "Verify Your Account",
                text: `Your OTP is ${otp}`,
            };
            await transporter.sendMail(mailOptions);

            return res.status(403).json({
                message: "Account not verified. OTP resent.",
                redirectToOtp: true,
            });
        }

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7
        });

        res.status(200).json({
            success: true,
            message: "User Logged In Successfully",
            user: {
                id: user.username,
                email: user.email,
                name: user.name,
            }
        });
    } catch (error) {
        console.log("Error logging in:", error);
        res.status(500).json({
            error: "Invalid Credential"
        });
    }
};

// Send OTP for verification
export const sendVerifyOtp = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "User Not Found" });
        }

        if (user.IsVerified) {
            return res.status(400).json({ message: "User Already Verified" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        await db.user.update({
            where: { email },
            data: {
                VerificationToken: otp,
                VerifyOtpExpireAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h expiry
            },
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Account Verification OTP",
            text: `Your OTP is ${otp}`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: "Verification mail sent" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Can't send OTP" });
    }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const { otp } = req.body;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: "User Not Found" });
        }

        if (user.VerificationToken !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (new Date(user.VerifyOtpExpireAt) < new Date()) {
            return res.status(400).json({ message: "OTP expired" });
        }

        await db.user.update({
            where: { email },
            data: {
                IsVerified: true,
                VerificationToken: null,
                VerifyOtpExpireAt: null,
            },
        });

        res.json({ message: "User Verified" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Verification failed" });
    }
};

// Logout user
export const logout = async (req, res) => {
    try {
        res.clearCookie("jwt", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV !== "development"
        });

        res.status(200).json({
            success: true,
            message: "User logged out successfully"
        });
    } catch (error) {
        console.log("Error logging out user:", error);
        res.status(500).json({
            error: "Error logging out user"
        });
    }
};

// Forgot Password (Send OTP)
export const forgetpassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "All fields required"
            });
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: "User not found" });

        const resetToken = String(Math.floor(100000 + Math.random() * 900000));
        const expiry = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

        await db.user.update({
            where: { email },
            data: { resetToken, resetTokenExpiry: expiry },
        });

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "PASSWORD RESET",
            text: `Your OTP for reset password is ${resetToken}`
        };

        await transporter.sendMail(mailOptions);

        console.log(`Reset link: http://localhost:3000/reset-password/${resetToken}`);
        res.json({ message: "Reset link sent to email" });
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            error: "Can't send the link"
        });
    }
};

// Reset Password
export const resetpassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const user = await db.user.findUnique({
        where: {
            email
        },
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    try {
        if (otp !== user.resetToken) {
            return res.status(400).json({
                error: "Invalid OTP"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                resetToken: "",
                resetTokenExpiry: null,
            },
        });

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.log(error);
        return res.status(400).json({
            error: "Failed to reset password"
        });
    }
};
