const jwt = require('jsonwebtoken')
const jwtSecret = process.env.JWT_SECRET

const generateTokenAndSetCookie = async (userId, username, userCoordsId, res) => {
    const token = jwt.sign({userId, username, userCoordsId }, jwtSecret, {
        expiresIn: '15d'
    })

    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 1000,
        httpOnly: true,
        sameSite: 'None',
        secure: true
    })

    console.log('Cookie set successfully')
}

module.exports = generateTokenAndSetCookie