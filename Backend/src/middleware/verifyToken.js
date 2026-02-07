const jwt = require('jsonwebtoken')
const { default: mongoose } = require('mongoose')
const jwtSecret = process.env.JWT_SECRET

const verifyToken = (req, res, next) => {
    try {
        const jwtToken = req.cookies.jwt
        
        if (!jwtToken) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        const decoded = jwt.verify(jwtToken, jwtSecret)

        if (!decoded) {
            return res.status(401).json({ error: "Invalid Token" })
        }

        const userObjectId = new mongoose.Types.ObjectId(decoded.userId)
        const myCoordsId = new mongoose.Types.ObjectId(decoded.userCoordsId)
        console.log(decoded)

        req.userId = decoded.userId
        req.userObjectId = userObjectId
        req.myCoordsId = myCoordsId
        next()
    } catch (err) {
        console.log(err)
        return res.status(500).json({error: "Internal Server Error"})
    }
}

module.exports = verifyToken