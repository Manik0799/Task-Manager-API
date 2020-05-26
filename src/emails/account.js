const sgMail= require("@sendgrid/mail")


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to  : email,
        from : "dungeon0799master@gmail.com",
        subject : "Welcome to the app",
        text : `Thanks for joining our services, ${name}. Let us know how you get along with the app.`
    })
}

const sendCancelMail = (email, name) => {
    sgMail.send({
        to  : email,
        from : "dungeon0799master@gmail.com",
        subject : "Cancellation request of your user account",
        text : `Your account cancellation request was successful, ${name}. Please, let us know of our services`
    })
}

module.exports= {
    sendWelcomeMail,
    sendCancelMail
}