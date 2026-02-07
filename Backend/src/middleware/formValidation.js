const { body, validationResult } = require('express-validator')

const handleValidationErrors = async (req, res, next) => {
    if (req.body.type === "profilePicture") {
        next()
    }
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    next()
}

const validateMyUserRequest = [
    body("username").isString().notEmpty().withMessage("Username must be a string"),
    body("password").isString().notEmpty().withMessage("Password must be a string"),
    handleValidationErrors,
]

const validateMyPatchEditRequest = [
    body("username").isString().notEmpty().withMessage("Username must be a string"),
    handleValidationErrors,
]

const validateMyEmailRequest = [
    body("email").isString().isEmail().notEmpty().withMessage("Invalid email format"),
    handleValidationErrors,
]

module.exports = {
    validateMyUserRequest,
    validateMyPatchEditRequest,
    validateMyEmailRequest,
}