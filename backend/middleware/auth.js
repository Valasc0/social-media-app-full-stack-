
const jwt = require("jsonwebtoken")

function authenticateToken(req,res,next){
    
    const authHeader = req.headers.authorization;
    
    const token = authHeader && authHeader.split(" ")[1]

    if(!token){
        return res.status(401).json({
            message: "Token not found "
        });
    }

    try{
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
            
        );

        req.userId = decoded.userId;
        next()

    }catch(error){
        if(error.name === "TokenExpiredError"){
             return res.status(401).json({
            message: "Access token expired"
        });
    
        }
        return res.status(403).json({
            message: "Invalid token"
        })
    }
}


module.exports = authenticateToken;