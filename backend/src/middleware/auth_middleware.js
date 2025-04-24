import jwt from "jsonwebtoken"
import {db} from "../libs/db.js"
export const userAuth = async (req , res , next) => {
    const token = req.cookies.token || req.cookies.jwt;
    if(!token) {
        return res.json({
            sucess : false ,
            message: "Login Again"
        })
    }

    try {
        const tokenDecode = jwt.verify(token , process.env.JWT_SECRET)
        console.log(tokenDecode);
        
        if(tokenDecode.email){
            req.body.email = tokenDecode.email;
        }
        else{
            return res.json({
                message: 'login again'
            })
        }
       

    } catch (error) {
        
    }
    next()
}

