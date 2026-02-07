const User = require("../models/users")
const Video = require("../models/videos")
const uploadMedia = require("../utils/uploadMedia")

const getMyVideos = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ error: "User not found" }) 
        }

        const myVideos = await Video.find({ owner: user._id })
        .populate({
            path: "owner",
            select: "-password"
        })

        if (myVideos) {
            return res.status(200).json( myVideos )
        }
        
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal server error" })
    }
}

const uploadMyVideo = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ error: "User not found" }) 
        }

        const { video, coverPhoto } = req.files
        const { videoName, videoDuration, videoSize, videoFormat } = req.body

        const videoUrl = await uploadMedia(video[0], 'video')

        let coverPhotoUrl = ''
        if (coverPhoto && coverPhoto.length > 0) {
            coverPhotoUrl = await uploadMedia(coverPhoto[0], 'image')
        }

        if (!videoUrl) {
            return res.status(400).json({ error: "Error Uploading Video" })
        }

        const newVideo = new Video({
            videoUrl,
            owner: user._id,
            name: videoName,
            coverPhoto: coverPhotoUrl || '',
            size: videoSize,
            duration: videoDuration,
            format: videoFormat
        })

        if (newVideo) {
            await newVideo.save()
        }

        return res.status(201).json({ success: "Upload Successful", video: newVideo })

    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal server error" })
    }
}

module.exports = {
    getMyVideos,
    uploadMyVideo
}