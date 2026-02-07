const jwtSecret = process.env.JWT_SECRET
const jwt = require('jsonwebtoken')

const authenticateSocket = (socket, next) => {
    console.log("socket hit")
    const jwtToken = socket.request.headers.cookie?.split('; ').find(row => row.startsWith('jwt='))?.split('=')[1]

    if (!jwtToken) {
        console.log('unauthorized')
        return next(new Error('Unauthorized'))
    }

    try {
        const decoded = jwt.verify(jwtToken, jwtSecret)
        if (!decoded) {
            return next(new Error('Invalid Token'))
        }
        socket.userId = decoded.userId
        next()
    } catch (err) {
        console.error(err)
        next(new Error('Internal Server Error'))
    }
}

module.exports = authenticateSocket