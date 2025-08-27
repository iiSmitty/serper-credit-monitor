const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailNotifier {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    }

    async sendCreditReport(creditCount) {
        try {
            const currentDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const currentDateTime = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Africa/Johannesburg',
                timeZoneName: 'short'
            });

            const statusInfo = this.getCreditStatusInfo(creditCount);

            const mailOptions = {
                from: '"Serper Credit Monitor" <' + process.env.GMAIL_EMAIL + '>',
                to: process.env.RECIPIENT_EMAIL,
                subject: 'Serper Daily Credit Report - ' + currentDate,
                text: this.generatePlainTextEmail(creditCount, currentDateTime, statusInfo),
                html: this.generateHtmlEmail(creditCount, currentDateTime, statusInfo)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully, Message ID:', result.messageId);
            return result;

        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    generatePlainTextEmail(creditCount, currentDateTime, statusInfo) {
        return 'Hello,\n\n' +
            'You have ' + creditCount.toLocaleString() + ' Serper credits remaining as of ' + currentDateTime + '.\n\n' +
            statusInfo.icon + ' ' + statusInfo.message + '\n\n' +
            'This is an automated message from your Serper Credit Monitor.';
    }

    generateHtmlEmail(creditCount, currentDateTime, statusInfo) {
        return '<html>' +
            '<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">' +
            '<h2 style="color: #333;">Serper Daily Credit Report</h2>' +
            '<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">' +
            '<p style="font-size: 18px; margin: 0;">' +
            '<strong>Credits Remaining:</strong> ' +
            '<span style="color: ' + statusInfo.color + '; font-size: 24px;">' + creditCount.toLocaleString() + '</span>' +
            '</p>' +
            '<p style="color: #666; margin: 10px 0 0 0;">As of ' + currentDateTime + '</p>' +
            '</div>' +
            '<div style="background-color: ' + statusInfo.color + '15; border-left: 4px solid ' + statusInfo.color + '; padding: 15px; margin: 20px 0;">' +
            '<p style="margin: 0; color: ' + statusInfo.color + ';">' +
            '<strong>' + statusInfo.icon + ' ' + statusInfo.message + '</strong>' +
            '</p>' +
            '</div>' +
            '<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">' +
            '<p style="color: #666; font-size: 12px;">' +
            'This is an automated message from your Serper Credit Monitor.' +
            '</p>' +
            '</body>' +
            '</html>';
    }

    getCreditStatusInfo(creditCount) {
        if (creditCount > 1000) {
            return {
                color: '#28a745',
                icon: '✅',
                message: 'You have plenty of credits remaining.'
            };
        } else if (creditCount > 100) {
            return {
                color: '#ffc107',
                icon: '⚠️',
                message: 'Your credits are getting low. Consider topping up soon.'
            };
        } else {
            return {
                color: '#dc3545',
                icon: '🚨',
                message: 'URGENT: You\'re running very low on credits! Please top up immediately.'
            };
        }
    }

    async sendErrorNotification(error) {
        try {
            const currentDateTime = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Africa/Johannesburg',
                timeZoneName: 'short'
            });

            const mailOptions = {
                from: '"Serper Credit Monitor" <' + process.env.GMAIL_EMAIL + '>',
                to: process.env.RECIPIENT_EMAIL,
                subject: '🚨 Serper Credit Monitor Error - ' + new Date().toLocaleDateString(),
                text: 'Error in Serper Credit Monitor\n\n' +
                    'Time: ' + currentDateTime + '\n' +
                    'Error: ' + error.message + '\n\n' +
                    'Please check the GitHub Actions logs for more details.\n\n' +
                    'This is an automated error notification from your Serper Credit Monitor.',
                html: '<html>' +
                    '<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">' +
                    '<h2 style="color: #dc3545;">🚨 Serper Credit Monitor Error</h2>' +
                    '<div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 20px 0;">' +
                    '<p><strong>Time:</strong> ' + currentDateTime + '</p>' +
                    '<p><strong>Error:</strong> ' + error.message + '</p>' +
                    '</div>' +
                    '<p>Please check the GitHub Actions logs for more details.</p>' +
                    '<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">' +
                    '<p style="color: #666; font-size: 12px;">' +
                    'This is an automated error notification from your Serper Credit Monitor.' +
                    '</p>' +
                    '</body>' +
                    '</html>'
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Error notification sent:', result.messageId);
            return result;
        } catch (emailError) {
            console.error('Failed to send error notification email:', emailError);
            throw emailError;
        }
    }
}

module.exports = { EmailNotifier };