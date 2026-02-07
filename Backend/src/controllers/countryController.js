const getCountries = async (req, res) => {
    try {
        return res.status(200).json({ success: "Countries Retrieved Successfully!" })
    } catch (err) {
        console.log("Error in getCountries controller: ", err)
        return res.status(500).json({ error: "Internal Server Error" })
    }
}

module.exports = { getCountries }