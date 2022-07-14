const nodemailer = require("nodemailer");



const EmailVerify = async (userEmail, name, token) => {

    // async..await is not allowed in global scope, must use a wrapper
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        // secure: false, // true for 465, false for other ports
        // service: "gmail",
        auth: {
            user: process.env.EMAIL, // generated ethereal user
            pass: process.env.EMAIL_PASS, // generated ethereal password
        },
    });

    // send mail with defined transport object
    transporter.sendMail({
        from: process.env.EMAIL, // sender address
        to: userEmail, // list of receivers
        // http://localhost:3000/register
        subject: "Verify Email, send by collegezone.netlify.app", // Subject line
        text: `${name}, please verify email`, // plain text body
        html: `<b> click here for verify email.<a href=${process.env.CLIENT_URL + "/verify/" + token}> click</a ></b > `, // html body
    }, (err, result) => {
        if (err) {
            console.log("not send" + err)
            return 500
        }
        else {
            console.log({ result: result.envelope.to })
            console.log("success full send", userEmail)
            console.log(userEmail)
            return 200
        }
    });

    // console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

}

module.exports = EmailVerify