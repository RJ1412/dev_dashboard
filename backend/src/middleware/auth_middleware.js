export const userAuth = async (req , res , next) => {
    const token = req.cookies.token || req.cookies.jwt;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Login Again"
        });
    }

    try {
        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
        if (tokenDecode.email) {
            req.body.email = tokenDecode.email;
            next(); // only proceed if everything is valid
        } else {
            return res.status(401).json({
                message: 'Login again'
            });
        }
    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
};
