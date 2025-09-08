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
                hour12: false,
                timeZone: 'Africa/Johannesburg'
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

    async sendHourlyAlert(creditCount, alertDecision, previousCredits) {
        try {
            const currentDateTime = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Africa/Johannesburg'
            });

            const statusInfo = this.getCreditStatusInfo(creditCount);
            const alertInfo = this.getAlertInfo(alertDecision, creditCount, previousCredits);

            const mailOptions = {
                from: '"Serper Credit Monitor" <' + process.env.GMAIL_EMAIL + '>',
                to: process.env.RECIPIENT_EMAIL,
                subject: alertInfo.subject,
                text: this.generateHourlyAlertText(creditCount, currentDateTime, alertInfo, previousCredits),
                html: this.generateHourlyAlertHtml(creditCount, currentDateTime, alertInfo, statusInfo, previousCredits)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Hourly alert sent successfully, Message ID:', result.messageId);
            return result;

        } catch (error) {
            console.error('Error sending hourly alert:', error);
            throw error;
        }
    }

    getAlertInfo(alertDecision, creditCount, previousCredits) {
        const currentTime = new Date().toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Johannesburg'
        });

        switch (alertDecision.alertType) {
            case 'critical':
                return {
                    subject: `🚨 URGENT: Serper Credits CRITICAL (${creditCount} remaining)`,
                    icon: '🚨',
                    title: 'CRITICAL - Credits Below 100',
                    message: 'Your credits have dropped below 100 and may run out very soon! Immediate action required.',
                    color: '#dc3545',
                    priority: 'CRITICAL'
                };
            case 'major_drop':
                const dropAmount = previousCredits - creditCount;
                return {
                    subject: `⚠️ Serper Credits Alert: Major Drop Detected (-${dropAmount} credits)`,
                    icon: '📉',
                    title: 'Major Credit Drop Detected',
                    message: `Your credits dropped by ${dropAmount} (${alertDecision.dropPercentage.toFixed(1)}%) since the last check. This may indicate an issue.`,
                    color: '#ff6b35',
                    priority: 'HIGH'
                };
            case 'approaching_critical':
                return {
                    subject: `⚠️ Serper Credits Warning: Approaching Critical Level (${creditCount} remaining)`,
                    icon: '⚠️',
                    title: 'Approaching Critical Level',
                    message: 'Your credits are approaching the critical threshold and continue to decline.',
                    color: '#ffc107',
                    priority: 'MEDIUM'
                };
            default:
                return {
                    subject: `📊 Serper Credits Update (${creditCount} remaining)`,
                    icon: '📊',
                    title: 'Credit Update',
                    message: 'Credit level update notification.',
                    color: '#6c757d',
                    priority: 'LOW'
                };
        }
    }

    generateHourlyAlertText(creditCount, currentDateTime, alertInfo, previousCredits) {
        let text = `${alertInfo.icon} ${alertInfo.title}\n\n`;
        text += `Current Credits: ${creditCount.toLocaleString()}\n`;
        if (previousCredits) {
            text += `Previous Credits: ${previousCredits.toLocaleString()}\n`;
            text += `Change: ${(creditCount - previousCredits).toLocaleString()}\n`;
        }
        text += `Time: ${currentDateTime}\n\n`;
        text += `${alertInfo.message}\n\n`;
        text += `Priority: ${alertInfo.priority}\n\n`;
        text += 'This is an automated alert from your Serper Credit Monitor.';
        return text;
    }

    generateHourlyAlertHtml(creditCount, currentDateTime, alertInfo, statusInfo, previousCredits) {
        const changeAmount = previousCredits ? creditCount - previousCredits : 0;
        const changeColor = changeAmount >= 0 ? '#28a745' : '#dc3545';
        const changeIcon = changeAmount >= 0 ? '↗️' : '↘️';

        return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Serper Credit Alert</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #1f2937;
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                padding: 20px;
                margin: 0;
            }
            
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                overflow: hidden;
            }
            
            .header {
                background: linear-gradient(135deg, ${alertInfo.color} 0%, ${alertInfo.color}dd 100%);
                padding: 24px;
                text-align: center;
                color: white;
                position: relative;
            }
            
            .header-content {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                position: relative;
                z-index: 1;
            }
            
            .header-title {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .header h1 {
                font-size: 24px;
                font-weight: 700;
                margin: 0;
                line-height: 1.2;
            }
            
            .priority-badge {
                background: rgba(255,255,255,0.25);
                backdrop-filter: blur(10px);
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                border: 1px solid rgba(255,255,255,0.2);
                white-space: nowrap;
            }
            
            .content {
                padding: 24px;
            }
            
            .alert-summary {
                background: linear-gradient(135deg, ${alertInfo.color}08 0%, ${alertInfo.color}15 100%);
                border: 2px solid ${alertInfo.color}30;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            
            .alert-summary::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: ${alertInfo.color};
                border-radius: 0 2px 2px 0;
            }
            
            .alert-message {
                font-size: 16px;
                font-weight: 600;
                color: ${alertInfo.color};
                margin: 0;
                line-height: 1.4;
                position: relative;
                z-index: 1;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .stat-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                position: relative;
                overflow: hidden;
            }
            
            .stat-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
            }
            
            .stat-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, ${alertInfo.color} 0%, ${alertInfo.color}80 100%);
            }
            
            .stat-label {
                font-size: 12px;
                color: #64748b;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                position: relative;
                z-index: 1;
            }
            
            .stat-value {
                font-size: 28px;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 4px;
                position: relative;
                z-index: 1;
            }
            
            .change-indicator {
                font-size: 14px;
                font-weight: 600;
                color: ${changeColor};
                margin-top: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                position: relative;
                z-index: 1;
            }
            
            .timestamp {
                font-size: 12px;
                color: #9ca3af;
                text-align: center;
                margin-bottom: 20px;
                padding: 8px 16px;
                background: #f8fafc;
                border-radius: 20px;
                border: 1px solid #e2e8f0;
                display: inline-block;
                width: 100%;
                box-sizing: border-box;
            }
            
            .footer {
                background: #f8fafc;
                padding: 20px 24px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer-text {
                font-size: 12px;
                color: #6b7280;
                margin: 0;
                line-height: 1.5;
            }
            
            .footer-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: ${alertInfo.color};
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                margin-top: 12px;
                text-decoration: none;
            }
            
            .footer-badge::before {
                content: '🤖';
                font-size: 14px;
            }
            
            /* Mobile responsiveness */
            @media only screen and (max-width: 600px) {
                body {
                    padding: 10px;
                }
                
                .email-container {
                    border-radius: 12px;
                }
                
                .header {
                    padding: 20px 16px;
                }
                
                .header h1 {
                    font-size: 20px;
                }
                
                .header-title {
                    flex-direction: column;
                    gap: 8px;
                }
                
                .content {
                    padding: 20px 16px;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }
                
                .stat-card {
                    padding: 16px;
                }
                
                .stat-value {
                    font-size: 24px;
                }
                
                .priority-badge {
                    padding: 4px 8px;
                    font-size: 10px;
                }
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .email-container {
                    background: #1f2937;
                    color: #f9fafb;
                }
                
                .stat-card {
                    background: #374151;
                    border-color: #6b7280;
                    color: #f9fafb;
                }
                
                .stat-value {
                    color: #f9fafb;
                }
                
                .footer {
                    background: #374151;
                    border-top-color: #6b7280;
                }
                
                .timestamp {
                    background: #374151;
                    border-color: #6b7280;
                    color: #d1d5db;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="header-content">
                    <div class="header-title">
                        <h1>${alertInfo.icon} ${alertInfo.title}</h1>
                        <span class="priority-badge">${alertInfo.priority}</span>
                    </div>
                </div>
            </div>
            
            <div class="content">
                <div class="timestamp">Alert generated at ${currentDateTime}</div>
                
                <div class="alert-summary">
                    <p class="alert-message">${alertInfo.message}</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Current Credits</div>
                        <div class="stat-value" style="color: ${statusInfo.color}">${creditCount.toLocaleString()}</div>
                    </div>
                    ${previousCredits ? `
                    <div class="stat-card">
                        <div class="stat-label">Previous Credits</div>
                        <div class="stat-value">${previousCredits.toLocaleString()}</div>
                        ${changeAmount !== 0 ? `<div class="change-indicator">${changeIcon} ${Math.abs(changeAmount).toLocaleString()}</div>` : ''}
                    </div>
                    ` : `
                    <div class="stat-card">
                        <div class="stat-label">Status</div>
                        <div class="stat-value" style="color: ${statusInfo.color}; font-size: 18px;">${statusInfo.icon}</div>
                    </div>
                    `}
                </div>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    Automated alert from your Serper Credit Monitor<br>
                    Monitoring your API usage to prevent service interruption
                </p>
                <div class="footer-badge">
                    Automated Monitoring
                </div>
            </div>
        </div>
    </body>
    </html>`;
    }

    generatePlainTextEmail(creditCount, currentDateTime, statusInfo) {
        return 'Hello,\n\n' +
            'You have ' + creditCount.toLocaleString() + ' Serper credits remaining as of ' + currentDateTime + '.\n\n' +
            statusInfo.icon + ' ' + statusInfo.message + '\n\n' +
            'This is an automated message from your Serper Credit Monitor.';
    }

    generateHtmlEmail(creditCount, currentDateTime, statusInfo) {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Serper Daily Credit Report</title>
            <!--[if mso]>
            <noscript>
                <xml>
                    <o:OfficeDocumentSettings>
                        <o:PixelsPerInch>96</o:PixelsPerInch>
                    </o:OfficeDocumentSettings>
                </xml>
            </noscript>
            <![endif]-->
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #1f2937;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    margin: 0;
                }
                
                .email-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: #ffffff;
                    border-radius: 16px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                }
                
                .header {
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    padding: 32px 24px;
                    text-align: center;
                    color: white;
                    position: relative;
                }
                
                .header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
                    opacity: 0.3;
                }
                
                .header h1 {
                    font-size: 28px;
                    font-weight: 700;
                    margin-bottom: 8px;
                    position: relative;
                    z-index: 1;
                }
                
                .header .subtitle {
                    font-size: 16px;
                    opacity: 0.9;
                    font-weight: 400;
                    position: relative;
                    z-index: 1;
                }
                
                .content {
                    padding: 32px 24px;
                }
                
                .credit-card {
                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                    border: 2px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 24px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .credit-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(79, 70, 229, 0.05) 0%, transparent 50%);
                    animation: pulse 3s ease-in-out infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                
                .credit-label {
                    font-size: 14px;
                    color: #64748b;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 8px;
                    position: relative;
                    z-index: 1;
                }
                
                .credit-amount {
                    font-size: 48px;
                    font-weight: 800;
                    color: ${statusInfo.color};
                    margin-bottom: 8px;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    position: relative;
                    z-index: 1;
                }
                
                .credit-timestamp {
                    font-size: 12px;
                    color: #9ca3af;
                    font-weight: 400;
                    position: relative;
                    z-index: 1;
                }
                
                .status-alert {
                    background: ${statusInfo.color}08;
                    border: 1px solid ${statusInfo.color}20;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                    position: relative;
                    overflow: hidden;
                    text-align: center;
                }
                
                .status-alert::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                    background: ${statusInfo.color};
                    border-radius: 0 2px 2px 0;
                }
                
                .status-content {
                    position: relative;
                    z-index: 1;
                }
                
                .status-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                    display: block;
                    line-height: 1;
                }
                
                .status-message {
                    font-size: 16px;
                    font-weight: 600;
                    color: ${statusInfo.color};
                    margin: 0;
                    line-height: 1.4;
                }
                
                .divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, #e2e8f0 50%, transparent 100%);
                    margin: 32px 0;
                }
                
                .footer {
                    background: #f8fafc;
                    padding: 24px;
                    text-align: center;
                    border-top: 1px solid #e2e8f0;
                }
                
                .footer-text {
                    font-size: 12px;
                    color: #6b7280;
                    margin: 0;
                    line-height: 1.5;
                }
                
                .footer-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #4f46e5;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                    margin-top: 12px;
                    text-decoration: none;
                }
                
                .footer-badge::before {
                    content: '🤖';
                    font-size: 14px;
                }
                
                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .email-container {
                        background: #1f2937;
                        color: #f9fafb;
                    }
                    
                    .credit-card {
                        background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
                        border-color: #6b7280;
                    }
                    
                    .footer {
                        background: #374151;
                        border-top-color: #6b7280;
                    }
                }
                
                /* Mobile responsiveness */
                @media only screen and (max-width: 600px) {
                    .email-container {
                        margin: 10px;
                        border-radius: 12px;
                    }
                    
                    .header {
                        padding: 24px 20px;
                    }
                    
                    .header h1 {
                        font-size: 24px;
                    }
                    
                    .content {
                        padding: 24px 20px;
                    }
                    
                    .credit-amount {
                        font-size: 36px;
                    }
                    
                    .credit-card {
                        padding: 20px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>Serper Daily Credit Report</h1>
                    <div class="subtitle">Your API usage monitoring dashboard</div>
                </div>
                
                <div class="content">
                    <div class="credit-card">
                        <div class="credit-label">Credits Remaining</div>
                        <div class="credit-amount">${creditCount.toLocaleString()}</div>
                        <div class="credit-timestamp">As of ${currentDateTime}</div>
                    </div>
                    
                    <div class="status-alert">
                        <div class="status-content">
                            <div class="status-icon">${statusInfo.icon}</div>
                            <div class="status-message">${statusInfo.message}</div>
                        </div>
                    </div>
                    
                    <div class="divider"></div>
                </div>
                
                <div class="footer">
                    <p class="footer-text">
                        This is an automated message from your Serper Credit Monitor.<br>
                        Keeping you informed about your API usage 24/7.
                    </p>
                    <div class="footer-badge">
                        Automated Monitoring
                    </div>
                </div>
            </div>
        </body>
        </html>`;
    }

    getCreditStatusInfo(creditCount) {
        if (creditCount >= 1000) {
            return {
                color: '#28a745',
                icon: '✅',
                message: 'You have plenty of credits remaining.'
            };
        } else if (creditCount >= 500) {
            return {
                color: '#17a2b8', // Info blue instead of warning
                icon: '📊',
                message: 'Your credit levels are healthy.'
            };
        } else if (creditCount >= 200) {
            return {
                color: '#ffc107',
                icon: '📊',
                message: 'Credit levels are moderate. Keep an eye on usage.'
            };
        } else if (creditCount >= 100) {
            return {
                color: '#ff6b35',
                icon: '⚠️',
                message: 'Credits are getting low. Consider topping up soon.'
            };
        } else {
            return {
                color: '#dc3545',
                icon: '🚨',
                message: 'CRITICAL: Very low credit levels! Top up immediately to avoid service interruption.'
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
                hour12: false,
                timeZone: 'Africa/Johannesburg'
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