const bcrypt = require('bcryptjs')
const { v2: cloudinary } = require('cloudinary')
const User = require('../models/users')
const { userSocketMap } = require('../socket/socket')
const generateTokenAndSetCookie = require('../utils/generateToken')
const generateEmailVerificationToken = require('../utils/generateEmailVerificationToken')
const sendEmail = require('../utils/emailSender')
const uploadMedia = require('../utils/uploadMedia')
const { City, CityUser } = require('../models/Cities')
const { default: mongoose } = require('mongoose')
const { Hairstyle, Clothing, UserStyle } = require('../models/UserStyles')
const { rangeFromNegativeToPositive, pickRandom, maxs, mins } = require('../utils/userHelpers')
const { createError, handleEndSession, handleSuccessSession } = require('../utils/databaseHelpers')
const { updateCount } = require('../utils/actions')
const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)

const loginUser = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { username, password, fingerprint } = req.body

        if (!fingerprint) {
            throw createError("Failed to generate fingerprint", 409) 
        }

        const user = await User.findOne({ username }).select("_id username password fingerprints")
        if (!user) throw createError("Incorrect username or password", 400)

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) throw createError("Incorrect username or password", 400)

        const myStyle = await UserStyle.findOne({ userId: user._id }).select("_id").lean()
        if (!myStyle) throw createError("No user style found", 404)

        const myUserCoords = await CityUser.findOne({ userStyleId: myStyle._id })
        if (!myUserCoords) throw createError("No user coords found", 404)

        if (!user.fingerprints.includes(fingerprint)) {
            user.fingerprints.push(fingerprint)
            await user.save({ session })
        }

        generateTokenAndSetCookie(user._id, user.username, myUserCoords._id, res)
        await handleSuccessSession(session)
        return res.status(200).json({success: "Login Successful!"})
    } catch (err) {
        console.log(err)
        await handleEndSession(session)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const pfps = {
    male: ['/nopfpmale1.jpg', '/nopfpmale2.jpg', '/nopfpmale3.png'],
    female: ['/nopfpfemale1.jpg', '/nopfpfemale2.jpg', '/nopfpfemale3.jpg']
}

const signupUser = async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const { username, password, gender, fingerprint } = req.body

        if (username.length > 28) {
            throw createError("Username is too long", 409)
        }
        if (!password || password.length < 8) {
            throw createError("Password too short", 400)
        }
        if (!["male", "female"].includes(gender)) {
            throw createError("Invalid gender", 400)
        }
        if (!fingerprint) {
            throw createError("Failed to generate fingerprint", 409) 
        }

        const createdUser = await User.findOne({ username })

        if (createdUser) {
            throw createError("Username already exists", 409)
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds)

        // create pfp
        const userPfp = pickRandom(pfps[gender])

        // find any users with the current fingerprint
        const personCityPool = await User.distinct('origin', { fingerprints: fingerprint })

        // Step 2: Find cities not in that list
        let realCityPool = await City.find({ _id: { $nin: personCityPool } }).select('_id region zone skintones averageBuild').lean()

        // Step 3: Fallback if user has been in all cities
        if (realCityPool.length === 0) {
            realCityPool = await City.find({}).select('_id region zone skintones averageBuild').lean()
        }

        // Step 4: Pick a random city
        const thisUsersOrigin = new mongoose.Types.ObjectId('6881a158babca1fbdeb777f6') // testing purposes
        // const thisUsersOrigin = pickRandom(realCityPool)._id
        const thisUsersCity = await City.findById(thisUsersOrigin)
        if (!thisUsersCity) {
            throw createError("Couldn't find City", 404)
        }

        // Step 5: Genareate user hairstyle
        const hairsForCity = await Hairstyle.find({ pref: gender, regions: thisUsersCity.region, zones: thisUsersCity.zone }).select("_id").lean()
        if (!hairsForCity || hairsForCity.length === 0) {
            throw createError("Couldn't find Hairstyles", 404)
        }
        const thisUsersHair = pickRandom(hairsForCity)._id

        // Step 6: Generate user clothes
        async function getClothesByType(city, type) {
            return Clothing.find({
                clothType: type,
                regions: city.region,
                zones: city.zone
            })
            .select("_id clothType")
            .lean()
        }
        const [topClothesForCity, bottomClothesForCity] = await Promise.all([
            getClothesByType(thisUsersCity, "top"),
            getClothesByType(thisUsersCity, "bottom"),
        ])
        if (!topClothesForCity || !bottomClothesForCity) {
            throw createError("Couldn't find Clothes", 404)
        }
        const thisUsersClothes = { 
            top: pickRandom(topClothesForCity)._id,
            bottom: pickRandom(bottomClothesForCity)._id
        }

        // Step 7: Generate user skin
        const thisUsersSkintone = pickRandom(thisUsersCity.skintones)

        // Step 8: Generate user stats and build
        const offset = thisUsersCity.averageBuild[gender].offset
        const offsetRange = rangeFromNegativeToPositive(offset)
        const thisUsersOffset = offsetRange[Math.floor(Math.random() * offsetRange.length)]
        const height = thisUsersCity.averageBuild[gender].height + (thisUsersOffset)
        const width = Math.max(Math.min(thisUsersCity.averageBuild[gender].width + (thisUsersOffset), maxs[gender].width), mins[gender].width)
        const musc = Math.max(Math.min(thisUsersCity.averageBuild[gender].musc + (thisUsersOffset), maxs[gender].musc), mins[gender].musc)
        const curve = thisUsersCity.averageBuild[gender].curve ? Math.max(Math.min(thisUsersCity.averageBuild[gender].curve  + (thisUsersOffset), maxs["female"].curve), mins["female"].curve) : null
        // const stats = {
        //     strength: Math.max(((gender === "male" ? 50 : 40) + (thisUsersOffset)), 0),
        //     smarts: Math.max(((gender === "male" ? 50 : 60) + (thisUsersOffset)), 0),
        //     health: 100,
        //     immunity: Math.max(((gender === "male" ? 50 : 60) + (thisUsersOffset)), 0),
        //     energy: 100,
        //     endurance: Math.max(((gender === "male" ? 50 : 40) + (thisUsersOffset)), 0),
        //     speed: Math.max(((gender === "male" ? 190 : 180) + (thisUsersOffset)), 0),
        //     damage: Math.max(((gender === "male" ? 5 : 1) + (thisUsersOffset)), 0),
        // }
        const stats = {
            strength: Math.max((gender === "male" ? 50 : 40) + (thisUsersOffset), 0),
            smarts: Math.max((gender === "male" ? 50 : 60) + (thisUsersOffset), 0),
            health: 100,
            immunity: Math.max((gender === "male" ? 50 : 60) + (thisUsersOffset), 0),
            energy: 100,
            endurance: Math.max((gender === "male" ? 50 : 40) + (thisUsersOffset), 0),
            speed: Math.max((gender === "male" ? 190 : 180) + (thisUsersOffset), 0),
            damage: Math.max((gender === "male" ? 5 : 1) + (thisUsersOffset), 0),
        }

        const newUser = new User({
            username,
            password: hashedPassword,
            fingerprints: [ fingerprint ],
            origin: thisUsersOrigin,
            profilePicture: userPfp
        })

        const thisUsersStyle = { userId: newUser._id, gender, height, width, musc, curve, skin: thisUsersSkintone, clothes: thisUsersClothes, hair: thisUsersHair, stats  }
        const newUserStyle = new UserStyle(thisUsersStyle)

        // Step 9: Generate user coords
        const thisUsersCoords = { cityId: thisUsersOrigin, plotId: 778, x: 800, y: 1400, layerIdx: 0, userStyleId: newUserStyle._id,
        on: "land", wallPlotId: null, wallLoc: null, view: [], holding: null, facing: "l"}
        const newUserCoords = new CityUser(thisUsersCoords)

        // Final
        console.log(newUser)
        console.log(thisUsersStyle)

        await newUser.save({ session })
        await newUserStyle.save({ session })
        await newUserCoords.save({ session })
        generateTokenAndSetCookie(newUser._id, newUser.username, newUserCoords._id, res)
        await handleSuccessSession(session)
        return res.status(201).json({ username: newUser.username, success: "Signup successful" })

    } catch (err) {
        console.log(err)
        await handleEndSession(session)
        return res.status(err.statusCode || 500).json({error: err.message || "Internal Server Error"})
    }
}

const patchEditUsername = async (req, res) => {
    try {
        const { username } = req.body

        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        const usernameExists= await User.findOne({ username })

        if (usernameExists) {
            return res.status(409).json({error: "Username already exists"})
        }

        user.username = username
        await user.save()
        return res.status(201).json({ success: "Update Successfull!" })
        
    } catch (err) {
        console.log(err)
        res.status(500).json({error: "Internal server error"})
    }
}

const patchEditProfilePic = async (req, res) => {
    try {
        const user = await User.findById(req.userId)

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        const profilePicture = await uploadMedia(req.file, "image")

        user.profilePicture = profilePicture
        await user.save()
        return res.status(201).json({ success: "Update Successfull!" })
        
    } catch (err) {
        console.log(err)
        res.status(500).json({error: "Internal server error"})
    }
}

const sendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(409).json({ error: "No email available" })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" })
        }

        const existingEmail = await User.findOne({ email })
        if (existingEmail) {
            return res.status(409).json({ error: "Email has been taken" })
        }

        const { userId } = req
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        if (user.token && (user.tokenExpiryDate > Date.now()) && (user.pendingEmail === email)) {
            return res.status(409).json({ error: "A verification email has already been sent"})
        }

        const token = generateEmailVerificationToken()
        const verificationLink = `${process.env.DOMAIN_NAME}/api/my/user/verify-email?id=${userId}&token=${token}`

        const emailBody = `
                <h3>Hello, ${user.username}!</h3>

                <p>Click <a href="${verificationLink}">here</a> to verify your email</p>
                <p>This link will expire after 5 minutes. You can request for a new link after it expires.</p>
                <p>If you didn't sign up, you can safely ignore this email.</p>
                <br>
                <p>Best regards,<br>Placid Society Team</p>`

        try {
            await sendEmail(email, 'Verify your Email', emailBody)
        } catch (err) {
            console.log('Email send error:', err)
            return res.status(409).json({ error: "Error sending verification email"})
        }

        user.token = token
        user.tokenExpiryDate = Date.now() + 300000 // expires in 5 mins(ms)
        user.pendingEmail = email 

        await user.save()

        return res.status(200).json({ success: "Email Verification sent Successfully!" })
        
    } catch (err) {
        console.log(err)
        return res.status(500).json({error: "Internal server error"})
    }
}

const verifyMyEmail = async (req, res) => {
    try {
        const { id: userId, token } = req.query
        const user = await User.findById(userId)
        const domainRoute = `${process.env.FRONTEND_URL}/verification`
        if (!user) return res.redirect(`${domainRoute}/failed/no-user`)
        // if (!user) return res.status(404).json({ erorr: "User not found" })
        if (!token) return res.redirect(`${domainRoute}/failed/no-token`)
        // if (!token) return res.status(404).json({ error: "No available token" }) 
        if (user.token && (user.tokenExpiryDate < Date.now())) return res.redirect(`${domainRoute}/failed/expired-token`)
        // if (user.token && (user.tokenExpiryDate < Date.now())) return res.status(400).json({ error: "Token has Expired" })
        if (user.token !== token) return res.redirect(`${domainRoute}/failed/fishy`)
        // if (user.token !== token) return res.status(400).json({ error: "Something fishy is going on here" })

        const emailExists = await User.findOne({ email: user.pendingEmail })
        if (emailExists) return res.redirect(`${domainRoute}/failed/email-taken`)
        // if (emailExists) return res.status(400).json({ error: "Sorry this email has just been taken" })

        user.email = user.pendingEmail
        user.pendingEmail = undefined
        user.token = undefined
        user.tokenExpiryDate = undefined
        user.isVerified = true

        await user.save()
        return res.redirect(`${domainRoute}/successful`)
        // return res.status(200).json({ success: "Email Verified!" })

    } catch (err) {
        console.log(err)
        return res.redirect(`${domainRoute}/failed/internal-server-error`)
    }
}

const getUser = async (req, res) => {
    console.log("tried")
    try {
        const { userId } = req
        const user = await User.findById(userId)
            .select("-password")
            .populate({
                path: 'friends.userId',
                select: 'username profilePicture',
            })
            .populate({
                path: 'notifications',
                populate: {
                    path: 'from',
                    select: 'username profilePicture'
                },
                options: { sort: { date: -1 } }
            })
            .populate({
                path: "rooms",
                select: 'name coverPhoto theme'
            })
            .populate({ 
                path: "savedRooms",
                select: 'name coverPhoto theme'
            })
            .populate({
                path: "favoriteRooms",
                select: 'name coverPhoto theme'
            })

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        const onlineFriends = []
        const offlineFriends = []

        user.friends.forEach((friend) => {
            if (userSocketMap.get(friend.userId._id.toString())) {
                onlineFriends.push(friend)
            } else {
                offlineFriends.push(friend)
            }
        })

        const updatedUser = {
            ...user.toObject(),
            onlineFriends,
            offlineFriends
        }

        return res.status(200).json( updatedUser )
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal Server Error" })
    }
} 

const getUserActivity = async (req, res) => {
    try {
        const { userId } = req
        const user = await User.findById(userId)
            .select("recentRooms")
            .populate({
                path: "recentRooms.roomId",
                select: "name coverPhoto theme participants"
            })

        if (!user) {
            return res.status(200).json([])
        }
        const activity = []
        const sortedRooms = user.recentRooms.sort((a, b) => b.joinedAt - a.joinedAt)
        sortedRooms.map(room => {
            return activity.push(room.roomId)
        })

        return res.status(200).json(activity)
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" })
    }
}

const getUserCoords = async (req, res) => {
    try {
        const { userId } = req
        const myStyle = await UserStyle.findOne({ userId }).select("_id").lean()
        if (!myStyle) throw createError("No user found", 404)

        const myUserCoords = await CityUser.findOne({ userStyleId: myStyle._id })
        .select('-cityId -__v')
        .populate({
            path: 'userStyleId',
            select: '-__v',
            populate: [{
                path: 'userId',
                select: 'username'
            },
            {
                path: 'clothes.top',
                select: '-__v -regions -zones -name -clothType -colours'
            },
            {
                path: 'clothes.bottom',
                select: '-__v -regions -zones -name -clothType -colours'
            },
            {
                path: 'hair',
                select: '-__v -regions -zones -colour -name -pref'
            },]
        })
        .populate({
            path: 'holding',
            select: '_id userStyleId',
            populate: {
                path: 'userStyleId',
                select: 'userId -_id',
                populate: {
                    path: 'userId',
                    select: 'username'
                } 
            },
        })
        .lean()
        if (!myUserCoords) throw createError("Couldn't find User Coords", 404)    
        const myStats = myUserCoords.userStyleId.stats
        if (!myStats) throw createError("Couldn't find User Coords", 404) 
        const { count: energy, lastGenerated: lgn } = updateCount(100, Date.now(), myStats.energy, 30000, myStats.lgn)
        const updatedUserCoords = { ...myUserCoords, userStyleId: { ...myUserCoords.userStyleId, stats: { ...myStats, energy, lgn } } }

        return res.status(200).json(updatedUserCoords)

    } catch (err) {
        console.log(err)
        return res.status(err.statusCode || 500).json({ error: err.message || "Internal Server Error" })
    }
}

const logoutUser = async (req, res) => {
    try {
        res.clearCookie("jwt")
        return res.status(200).json({success: "Logged out successfully"})
    } catch (err) {
        console.log(err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

module.exports = {
    patchEditUsername,
    patchEditProfilePic,
    sendVerificationEmail,
    verifyMyEmail,
    loginUser,
    signupUser,
    getUser,
    getUserActivity,
    getUserCoords,
    logoutUser,
}