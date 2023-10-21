// Require packages.  
const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

// Create a class Email.  
module.exports = class Email {
    // Constructor takes in user and url as arguments.  
    constructor(user, url) {
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url = url;
        this.from = process.env.EMAIL_FROM;
    }

    // If I am in production mode, create transport to send a real email via Sendgrid.  Otherwise, create transport to send email to mailtrap.  
    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD
                }
            })
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }

    // Method that sends the actual email.  
    // Render HTML based on a pug template.  
    // Define email options.  
    // Create a transport and send email.  
    async send(template, subject) {
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            subject
        });
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText(html)
        };
        await this.newTransport().sendMail(mailOptions);
    }

    // Invoke send, sends an email of a welcome message.  
    async sendWelcome() {
        await this.send('welcome', 'Welcome to the Natours family!');
    }

    // Invoke send, sends an email of the token to reset user password.  
    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token (valid for only 10 minutes).');
    }
}