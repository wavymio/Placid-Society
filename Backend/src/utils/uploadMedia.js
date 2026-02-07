const { v2: cloudinary } = require('cloudinary')
const sharp = require('sharp')

const uploadMedia = async (file, resourceType) => {
    
    if (file.mimetype.startsWith('image/')) {
        const originalSize = file.buffer.length / 1024
        console.log(`Original size: ${originalSize.toFixed(2)} KB`)
        let processedImage

        const isAVIFOrWebP = file.originalname.endsWith('.avif') || file.originalname.endsWith('.webp')
        
        if (isAVIFOrWebP) {
            processedImage = await sharp(file.buffer)
                .resize(1024)
                .toFormat('avif', { 
                    quality: 5,
                })
                .toBuffer()
            console.log('Processed as AVIF for .avif or .webp image')
        } else {
            processedImage = Buffer.from(file.buffer)
            console.log('No processing done for non-AVIF/WebP image')
        }

        const newSize = processedImage.length / 1024
        console.log(`New size: ${newSize.toFixed(2)} KB`)

        // Convert the image buffer to a base64 string
        const base64Image = processedImage.toString('base64')

        const uploadResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_large(
                `data:${file.mimetype};base64,${base64Image}`, 
                {
                    resource_type: resourceType,
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
    } else if (file.mimetype.startsWith('video/')) {
        const base64Media = Buffer.from(file.buffer).toString("base64")
        const dataURI = `data:${file.mimetype};base64,${base64Media}`

        const uploadResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_large(
                dataURI,
                {
                    resource_type: resourceType,
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
    } else {
        throw new Error('Unsupported file type') 
    }
}

module.exports = uploadMedia