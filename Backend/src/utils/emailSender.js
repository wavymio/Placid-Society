const nodemailer = require('nodemailer')

const senderEmail = process.env.EMAIL
const senderName = "Placid Society"

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: senderEmail,
        pass: process.env.EMAIL_PASS
    }
})

const sendEmail = async (to, subject, html) => {
    await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to,
        subject,
        html
    })
}

module.exports = sendEmail