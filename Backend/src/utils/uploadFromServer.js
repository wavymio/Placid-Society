const { v2: cloudinary } = require('cloudinary')
const sharp = require('sharp')
const mime = require('mime-types')
const fs = require('fs')
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadandStore = async (path) => {
    if (!path) return null
    if (!fs.existsSync(path)) {
        throw new Error(`File at ${path} does not exist`)
    }

    const buffer = fs.readFileSync(path)
    const mimetype = mime.lookup(path) || 'image/png'

    if (!mimetype) {
        throw new Error(`Could not determine mimetype for ${path}`)
    }

    const file = {
        buffer,
        mimetype,
    }
    
    const originalSize = file.buffer.length / 1024
    console.log(`Original size: ${originalSize.toFixed(2)} KB`)
    const processedImage = await sharp(file.buffer)
                    // .resize(1024)
                    .toFormat('avif', { 
                        quality: 40,
                        effort: 3
                    })
                    .toBuffer()
    console.log('Processed as AVIF for .avif or .webp image')
    const newSize = processedImage.length / 1024
    console.log(`New size: ${newSize.toFixed(2)} KB`)

    // Convert the image buffer to a base64 string
    const base64Image = processedImage.toString('base64')
    const uploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
            `data:${file.mimetype};base64,${base64Image}`, 
            {
                resource_type: "image",
                timeout: 600000,
            },
            (error, result) => {
                if (error) {
                    return reject(error) 
                }
                resolve(result) 
            }
        )
    })

    console.log('Upload successful:', uploadResponse.url) 
    return uploadResponse.url
}

module.exports = uploadandStore