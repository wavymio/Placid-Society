const crypto = require('crypto')

const generateEmailVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex')
} 

module.exports = generateEmailVerificationToken