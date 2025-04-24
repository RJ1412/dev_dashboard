import {db} from "../libs/db.js"
import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { text } from "express";
import transporter from "../libs/nodemailer.js";
dotenv.config();

export const register = async(req , res) => {
    const {username , email , password , name} = req.body

    if(!username || !email || !password || !name){
        return res.status(400).jso({
            error  : "All fields required"           
        })
    }

    try {

        const existingUser = await db.User.findUnique({
            where:{
                email
            }
        })

        if(existingUser){
            return res.status(400).json({
                error: "User already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password , 10);

        const newUser = await db.User.create({
            data:{
                username , 
                email ,
                password: hashedPassword,
                name
            }
        })

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );

        res.cookie("jwt" , token, {
            httpOnly : true,
            sameSite : "strict",
            secure:process.env.NODE_ENV !== "development",
            maxAge : 1000*60*60*24*7
        })

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to : email,
            subject: 'Welcome to DevDashboard',
            text : `Welcome ${name} Your registered email is ${email} , Kindly Verify it`
        }

        await transporter.sendMail(mailOptions);
        res.status(201).json({
            success:true,
            message : "User Created Successfully",
            user: {
                id:newUser.id,
                username: newUser.username,
                email:newUser.email,
                name: newUser.name,
                role: newUser.role,
                image: newUser.image
            }
        })

    } catch (error) {
        console.log("Error creating user:" , error);
        res.status(500).json({
            error:"Error creating user"
        })
           
    }
}


export const login = async(req , res) => {
    const {email , password} = req.body;


    try {
        const user = await db.User.findUnique({
            where:{
                email
            }
        })

        if(!user){
            return res(400).json({
                error : "User not found"
            })
        }

        const isMatch = await bcrypt.compare(password , user.password);
        if(!isMatch){
            return res(400).json({
                error :  "Invalid Credential"
            })
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );


        res.cookie('token' , token, {
            httpOnly : true,
            sameSite : process.env.NODE_ENV === "production" ? 'none' : 'strict',
            secure:process.env.NODE_ENV === "production",
            maxAge : 1000*60*60*24*7
        })

        
        res.status(200).json({
            success: true,
            message : "User Loged In Successfully",
            user: {
                id:user.id,
                email:user.email,
                name: user.name,
            }
        })

    } catch (error) {
        console.log("Error logging in:" , error);
        res.status(500).json({
            error:"LOG IN FAILED"
        })
    }

}


export const sendVerifyOtp = async(req , res) => {
    try {
        console.log("step 1");
        
        const {email}= req.body;
        console.log(email);
        
        const user = await db.User.findUnique({
            where:{
                email
            }
        })

        if(!user){
            return res(400).json({
                error :  "User Not Find"
            })
        }
        console.log("Userrr",user);
        
        if(user.IsVerified){
            return res.status(400).json({
                message: "User Already Verified"
            })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))

        await db.user.update({
            where: { email },
            data: {
              VerificationToken: otp,
              VerifyOtpExpireAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          });
        // user.VerificationToken = otp;
        // user.VerifyOtpExpireAt = Date.now() + 24*60*60*1000;

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to : email,
            subject: 'Account Verification OTP',
            text : `Your OTP is ${otp}. Verify your account using this OTP`
        }

        await transporter.sendMail(mailOptions);

        res.json({
            message:"Verification mail sent"
        })

    } catch (error) {
        
    }
}


export const verifyOtp = async(req , res) => {
    const {email , otp}= req.body;
        console.log(email);
        
        const user = await db.User.findUnique({
            where:{
                email
            }
        })

        if(!user){
            return res(400).json({
                error :  "User Not Find"
            })
        }

        console.log(user);
        console.log(otp);
        console.log(user.VerificationToken);
        
        if(otp !== user.VerificationToken){
            return res.status(400).json({
                message : "Invalid OTP"
            })
        }

        if(user.VerifyOtpExpireAt < Date.now()){
            return res.json({
                message:"Otp expires"
            })
        }

        return res.json({
            message:"User Verified"
        })
    }

export const logout = async(req , res) => {
    try {
        res.clearCookie("jwt" , {
            httpOnly : true,
            sameSite : "strict",
            secure:process.env.NODE_ENV !== "development"
        })

        res.status(200).json({
            success: true,
            message: "User logged out succeddfully"
        })
    } catch (error) {
        console.log("Error logging out user:", error);
        res.status(500).json({
            error:"Error logging out user"
        })
        
    }
}

export const forgetpassword = async(req , res) => {

}

export const resetpassword = async(req , res) => {
    const {email , otp , password} = req.body

    if(!email || !otp || !password){
        res.status.json({
            message : "Invalid Fields"
        })
    }

    const user = await db.User.findUnique({
        where:{
            email
        }
    })

    const token = user.VerificationToken
    const expiryDate = user.VerifyOtpExpireAt
    try {
        if(otp !== token){
           return res.status.json({
                message:"Invalid Otp"
            })
        }

        if(Date.now() > expiryDate){
           return res.status.json({
                message:"OTP Expired"
            })
        }

        const hashedPassword = bcrypt.hash(password , 10);

        await db.user.update({
            where: { email },
            data: {
              password : hashedPassword,
              VerificationToken: "",
              VerifyOtpExpireAt: ''
            }
          });

          res.status.json({
            message:"PASSWORD UPDATED SUCCESSFULLY"
          })


    } catch (error) {
        
    }
}




