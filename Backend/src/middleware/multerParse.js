const multer = require('multer')

const storage = multer.memoryStorage()
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5000 * 1024 * 1024, // 5Gb
    }
})

module.exports = upload
