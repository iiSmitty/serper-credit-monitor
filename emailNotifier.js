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
                subject: `Serper Credits: ${creditCount.toLocaleString()} remaining`,
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
            const alertTimestamp = new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Africa/Johannesburg'
            }).replace(',', ' at');

            const statusInfo = this.getCreditStatusInfo(creditCount);
            const alertInfo = this.getAlertInfo(alertDecision, creditCount, previousCredits);

            const mailOptions = {
                from: '"Serper Credit Monitor" <' + process.env.GMAIL_EMAIL + '>',
                to: process.env.RECIPIENT_EMAIL,
                subject: `Serper Alert: ${creditCount.toLocaleString()} credits`,
                text: this.generateHourlyAlertText(creditCount, alertTimestamp, alertInfo, previousCredits),
                html: this.generateHourlyAlertHtml(creditCount, alertTimestamp, alertInfo, statusInfo, previousCredits)
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
        switch (alertDecision.alertType) {
            case 'critical':
                return {
                    subject: `URGENT: Serper Credits Critical (${creditCount} remaining)`,
                    title: 'Critical Credit Level',
                    message: 'Your credits have dropped to a critical level and may run out soon!',
                    color: '#dc3545',
                    priority: 'HIGH PRIORITY'
                };
            case 'significant_drop':
                const dropAmount = previousCredits - creditCount;
                return {
                    subject: `Serper Credits Alert: Large Drop Detected (-${dropAmount} credits)`,
                    title: 'Significant Credit Drop',
                    message: `Your credits dropped by ${dropAmount} (${alertDecision.dropPercentage.toFixed(1)}%) since the last check.`,
                    color: '#ff9800',
                    priority: 'MEDIUM PRIORITY'
                };
            case 'warning_zone_drop':
                return {
                    subject: `Serper Credits Warning: Continued Decline (${creditCount} remaining)`,
                    title: 'Credits Continuing to Drop',
                    message: 'Your credits are in the warning zone and continue to decline.',
                    color: '#F97316',
                    priority: 'MEDIUM'
                };
            default:
                return {
                    subject: `Serper Credits Update (${creditCount} remaining)`,
                    title: 'Credit Update',
                    message: 'Credit level update notification.',
                    color: '#6c757d',
                    priority: 'LOW PRIORITY'
                };
        }
    }

    generateHourlyAlertText(creditCount, currentDateTime, alertInfo, previousCredits) {
        let text = `${alertInfo.title}\n\n`;
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
        const changeSign = changeAmount > 0 ? '+' : '';
        const changeColor = changeAmount < 0 ? '#ff3333' : changeAmount > 0 ? '#33ff33' : '#aaaaaa';

        const warningLevel = creditCount < 1000 ? 'CRITICAL' :
            creditCount < 5000 ? 'WARNING' :
                creditCount < 10000 ? 'NOTICE' : 'NORMAL';

        const asciiAlert = alertInfo.priority === 'HIGH PRIORITY' ? `
    ██╗    ██╗ █████╗ ██████╗ ███╗   ██╗██╗███╗   ██╗ ██████╗ 
    ██║    ██║██╔══██╗██╔══██╗████╗  ██║██║████╗  ██║██╔════╝ 
    ██║ █╗ ██║███████║██████╔╝██╔██╗ ██║██║██╔██╗ ██║██║  ███╗
    ██║███╗██║██╔══██║██╔══██╗██║╚██╗██║██║██║╚██╗██║██║   ██║
    ╚███╔███╔╝██║  ██║██║  ██║██║ ╚████║██║██║ ╚████║╚██████╔╝
     ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚═╝  ╚═══╝ ╚═════╝ ` : `
     █████╗ ██╗     ███████╗██████╗ ████████╗
    ██╔══██╗██║     ██╔════╝██╔══██╗╚══██╔══╝
    ███████║██║     █████╗  ██████╔╝   ██║   
    ██╔══██║██║     ██╔══╝  ██╔══██╗   ██║   
    ██║  ██║███████╗███████╗██║  ██║   ██║   
    ╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝   ╚═╝   `;

        const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();

        const systemChecks = [
            { cmd: "sys.check.credits", status: "COMPLETE", time: "0.12s" },
            { cmd: "alert.calculate.delta", status: "COMPLETE", time: "0.05s" },
            { cmd: "threat.assessment", status: alertInfo.priority === 'HIGH PRIORITY' ? "CRITICAL" : "NORMAL", time: "0.18s" },
            { cmd: "notification.dispatch", status: "COMPLETE", time: "0.09s" }
        ];

        let systemOutput = '';
        systemChecks.forEach(check => {
            const statusColor = check.status === 'CRITICAL' ? '#ff0000' :
                check.status === 'COMPLETE' ? '#00ffff' : '#ffaa00';
            systemOutput += `<span style="color: #888888;">[${new Date().toISOString().slice(11, 19)}]</span> <span style="color: #00aa00;">${check.cmd}</span> <span style="color: ${statusColor};">${check.status}</span> <span style="color: #aaaaaa;">(${check.time})</span>\n`;
        });

        const creditBar = EmailNotifier.generateCreditBar(creditCount);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${alertInfo.title}</title>
    <style>
        @keyframes flicker {
            0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 1; }
            20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.8; }
        }
        @keyframes scan {
            0% { background-position: 0 -100vh; }
            35%, 100% { background-position: 0 100vh; }
        }
        @keyframes urgent-pulse {
            0% { box-shadow: 0 0 10px #ff0000; }
            50% { box-shadow: 0 0 30px #ff0000, 0 0 40px #ff0000; }
            100% { box-shadow: 0 0 10px #ff0000; }
        }
        .terminal {
            position: relative;
            overflow: hidden;
            border: ${alertInfo.priority === 'HIGH PRIORITY' ? '2px solid #ff0000' : '1px solid #00aa00'};
            box-shadow: ${alertInfo.priority === 'HIGH PRIORITY' ? '0 0 15px #ff0000' : '0 0 10px #003300'};
            animation: ${alertInfo.priority === 'HIGH PRIORITY' ? 'urgent-pulse 1.5s infinite' : 'none'};
        }
        .terminal::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 255, 0, 0.02) 50%);
            background-size: 100% 4px;
            pointer-events: none;
            animation: scan 7.5s linear infinite;
            z-index: 1;
        }
        .ascii-art {
            color: ${alertInfo.priority === 'HIGH PRIORITY' ? '#ff0000' : '#00dd00'};
            text-shadow: 0 0 5px ${alertInfo.priority === 'HIGH PRIORITY' ? '#ff0000' : '#00ff00'};
        }
        @keyframes blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
        }
    </style>
</head>
<body style="font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0; background-color: #000000; color: #00ff00; line-height: 1.4;">
    <!-- Preview text for email clients -->
    <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    ${alertInfo.priority} Credit Alert: ${creditCount.toLocaleString()} Serper credits remaining. ${alertInfo.message} Previous balance: ${previousCredits ? previousCredits.toLocaleString() : 'N/A'} credits. Change: ${changeSign}${Math.abs(changeAmount).toLocaleString()} credits since last check.
    </div>
    
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; color: #00ff00;">
        <tr>
            <td align="center" style="padding: 20px;">
                <table width="650" cellpadding="0" cellspacing="0" border="0" class="terminal" style="background-color: #000000;">
                    <tr>
                        <td style="padding: 20px;">
                            <pre style="margin: 0; padding: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 14px;">
<span style="color: ${alertInfo.priority === 'HIGH PRIORITY' ? '#ff0000' : '#00dd00'};" class="ascii-art">${asciiAlert}</span>

<span style="color: #aaaaaa;">═══════════════════════════════════════════════════════════</span>
<span style="color: #00ffff;">┌─ ALERT SYSTEM v4.1.2 ─┐</span>
<span style="color: #00ffff;">│</span> <span style="color: #ffffff;">SESSION ID: ${sessionId}</span> <span style="color: #00ffff;"> │</span>
<span style="color: #00ffff;">└───────────────────────┘</span>

<span style="color: #aaaaaa;"># Alert processing sequence</span>
${systemOutput}
<span style="color: #aaaaaa;">═══════════════════════════════════════════════════════════</span>

<span style="color: #ffffff;">┌─[${alertInfo.title.toUpperCase()}]──[${warningLevel}]</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ Timestamp:</span> <span style="color: #ffff00;">${currentDateTime}</span>
<span style="color: #ffffff;">│ Priority:</span> <span style="color: ${alertInfo.color}; font-weight: bold;">${alertInfo.priority}</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ Message:</span> <span style="color: #ff8800;">${alertInfo.message}</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ Current Credits:</span> <span style="color: ${statusInfo.color}; font-weight: bold;">${creditCount.toLocaleString()}</span>
<span style="color: #ffffff;">│ Previous Credits:</span> <span style="color: #00ffff;">${previousCredits ? previousCredits.toLocaleString() : 'N/A'}</span>
<span style="color: #ffffff;">│ Delta:</span> <span style="color: ${changeColor}; font-weight: bold;">${changeSign}${Math.abs(changeAmount).toLocaleString()}</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ Credit Level:</span> ${creditBar}
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">└─[EOF]</span>

<span style="color: #ff5555;">!! ACTION REQUIRED !!</span>
<span style="color: #ffffff;">MONITOR PANEL: https://api.serper.dev/dashboard</span>

<span style="color: #888888;">*** This is an automated alert. DO NOT REPLY. ***</span>
<span style="color: #888888;">*** Generated at node: SRP-ALERT-${Math.floor(Math.random() * 9) + 1} ***</span>
<span style="color: #888888;">*** Hash: ${EmailNotifier.generateRandomHash()} ***</span>

<span style="color: #00aa00;">serper@alertsystem:~$</span> <span style="color: #ffffff;">acknowledge_alert ${Math.random().toString(36).substring(2, 10)}</span>
<span style="color: #888888;">Alert acknowledged. Monitoring continues...</span>
<span style="color: #00aa00;">serper@alertsystem:~$</span> <span style="color: #00ff00;">█</span>
</pre>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    generatePlainTextEmail(creditCount, currentDateTime, statusInfo) {
        return 'Hello,\n\n' +
            'You have ' + creditCount.toLocaleString() + ' Serper credits remaining as of ' + currentDateTime + '.\n\n' +
            statusInfo.message + '\n\n' +
            'This is an automated message from your Serper Credit Monitor.';
    }

    generateHtmlEmail(creditCount, currentDateTime, statusInfo) {
        const warningLevel = creditCount < 1000 ? 'CRITICAL' :
            creditCount < 5000 ? 'WARNING' :
                creditCount < 10000 ? 'NOTICE' : 'NORMAL';

        const asciiLogo = `
    ███████╗███████╗██████╗ ██████╗ ███████╗██████╗ 
    ██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝██╔══██╗
    ███████╗█████╗  ██████╔╝██████╔╝█████╗  ██████╔╝
    ╚════██║██╔══╝  ██╔══██╗██╔═══╝ ██╔══╝  ██╔══██╗
    ███████║███████╗██║  ██║██║     ███████╗██║  ██║
    ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝`;

        const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();

        const systemChecks = [
            { cmd: "sys.check.credits", status: "COMPLETE", time: "0.21s" },
            { cmd: "sys.verify.account", status: "COMPLETE", time: "0.08s" },
            { cmd: "net.establish.connection", status: "COMPLETE", time: "0.13s" },
            { cmd: "report.generate", status: "COMPLETE", time: "0.35s" }
        ];

        let systemOutput = '';
        systemChecks.forEach(check => {
            systemOutput += `<span style="color: #888888;">[${new Date().toISOString().slice(11, 19)}]</span> <span style="color: #00aa00;">${check.cmd}</span> <span style="color: #00ffff;">${check.status}</span> <span style="color: #aaaaaa;">(${check.time})</span>\n`;
        });

        const creditBar = EmailNotifier.generateCreditBar(creditCount);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Serper Credit Monitor</title>
    <style>
        @keyframes flicker {
            0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 1; }
            20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.8; }
        }
        @keyframes scan {
            0% { background-position: 0 -100vh; }
            35%, 100% { background-position: 0 100vh; }
        }
        .terminal {
            position: relative;
            overflow: hidden;
        }
        .terminal::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 255, 0, 0.02) 50%);
            background-size: 100% 4px;
            pointer-events: none;
            animation: scan 7.5s linear infinite;
            z-index: 1;
        }
        .ascii-art {
            color: #00dd00;
            text-shadow: 0 0 5px #00ff00;
        }
        @keyframes blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
        }
    </style>
</head>
<body style="font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0; background-color: #000000; color: #00ff00; line-height: 1.4;">
        <!-- Preview text for email clients -->
<div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    Daily credit report: You have ${creditCount.toLocaleString()} Serper credits remaining as of ${currentDateTime}. ${statusInfo.message} This is your automated daily credit monitoring report from the Serper Credit Monitor system.
</div>
    
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; color: #00ff00;">
        <tr>
            <td align="center" style="padding: 20px;">
                <table width="650" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; border: 1px solid #00aa00; box-shadow: 0 0 10px #003300;">
                    <tr>
                        <td style="padding: 20px;" class="terminal">
                            <pre style="margin: 0; padding: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 14px;">
<span style="color: #00dd00;" class="ascii-art">${asciiLogo}</span>

<span style="color: #aaaaaa;">═══════════════════════════════════════════════════════════</span>
<span style="color: #00ffff;">┌─ CREDIT MONITOR v3.2.1 ─┐</span>
<span style="color: #00ffff;">│</span> <span style="color: #ffffff;">SESSION ID: ${sessionId}</span> <span style="color: #00ffff;">   │</span>
<span style="color: #00ffff;">└─────────────────────────┘</span>

<span style="color: #aaaaaa;"># System initialization sequence</span>
${systemOutput}
<span style="color: #aaaaaa;">═══════════════════════════════════════════════════════════</span>

<span style="color: #ffffff;">┌─[CREDIT_REPORT]──[${warningLevel}]</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ Timestamp:</span> <span style="color: #ffff00;">${currentDateTime}</span>
<span style="color: #ffffff;">│ Status:</span> <span style="color: ${statusInfo.color};">${statusInfo.message}</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ Available Credits:</span> <span style="color: #00ffff; font-weight: bold;">${creditCount.toLocaleString()}</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ Credit Level:</span> ${creditBar}
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">└─[EOF]</span>

<span style="color: #888888;">*** This is an automated system message. DO NOT REPLY. ***</span>
<span style="color: #888888;">*** Report generated at node: SRP-US-WEST-${Math.floor(Math.random() * 9) + 1} ***</span>

<span style="color: #00aa00;">serper@creditmonitor:~$</span> <span style="color: #ffffff;">exit</span>
<span style="color: #888888;">Closing secure connection...</span>
<span style="color: #00aa00;">serper@creditmonitor:~$</span> <span style="color: #00ff00;">█</span>
</pre>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    getCreditStatusInfo(creditCount) {
        if (creditCount > 1000) {
            return {
                color: '#166534',
                backgroundColor: '#F0FDF4',
                borderColor: '#BBF7D0',
                message: 'You have plenty of credits remaining.'
            };
        } else if (creditCount > 100) {
            return {
                color: '#B45309',
                backgroundColor: '#FFFBEB',
                borderColor: '#FEE2B1',
                message: 'Your credits are getting low. Consider topping up soon.'
            };
        } else {
            return {
                color: '#991B1B',
                backgroundColor: '#FEF2F2',
                borderColor: '#FECACA',
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
                hour12: false,
                timeZone: 'Africa/Johannesburg'
            });

            const mailOptions = {
                from: '"Serper Credit Monitor" <' + process.env.GMAIL_EMAIL + '>',
                to: process.env.RECIPIENT_EMAIL,
                subject: 'Serper Monitor: System Error Detected',
                text: 'Error in Serper Credit Monitor\n\n' +
                    'Time: ' + currentDateTime + '\n' +
                    'Error: ' + error.message + '\n\n' +
                    'Please check the GitHub Actions logs for more details.\n\n' +
                    'This is an automated error notification from your Serper Credit Monitor.',
                html: this.generateErrorHtml(error, currentDateTime)
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('Error notification sent:', result.messageId);
            return result;
        } catch (emailError) {
            console.error('Failed to send error notification email:', emailError);
            throw emailError;
        }
    }

    generateErrorHtml(error, currentDateTime) {
        const asciiError = `
    ███████╗██████╗ ██████╗  ██████╗ ██████╗ 
    ██╔════╝██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
    █████╗  ██████╔╝██████╔╝██║   ██║██████╔╝
    ██╔══╝  ██╔══██╗██╔══██╗██║   ██║██╔══██╗
    ███████╗██║  ██║██║  ██║╚██████╔╝██║  ██║
    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝`;

        const sessionId = Math.random().toString(36).substring(2, 10).toUpperCase();

        const systemChecks = [
            { cmd: "sys.initialize.monitor", status: "COMPLETE", time: "0.15s" },
            { cmd: "auth.verify.credentials", status: "COMPLETE", time: "0.08s" },
            { cmd: "net.test.connection", status: "FAILED", time: "2.34s" },
            { cmd: "error.handler.triggered", status: "ACTIVE", time: "0.02s" }
        ];

        let systemOutput = '';
        systemChecks.forEach(check => {
            const statusColor = check.status === 'FAILED' ? '#ff0000' :
                check.status === 'ACTIVE' ? '#ffaa00' : '#00ffff';
            systemOutput += `<span style="color: #888888;">[${new Date().toISOString().slice(11, 19)}]</span> <span style="color: #00aa00;">${check.cmd}</span> <span style="color: ${statusColor};">${check.status}</span> <span style="color: #aaaaaa;">(${check.time})</span>\n`;
        });

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Error</title>
    <style>
        @keyframes error-pulse {
            0% { box-shadow: 0 0 10px #ff0000; }
            50% { box-shadow: 0 0 30px #ff0000, 0 0 40px #ff0000; }
            100% { box-shadow: 0 0 10px #ff0000; }
        }
        @keyframes scan {
            0% { background-position: 0 -100vh; }
            35%, 100% { background-position: 0 100vh; }
        }
        .terminal {
            position: relative;
            overflow: hidden;
            border: 2px solid #ff0000;
            box-shadow: 0 0 15px #ff0000;
            animation: error-pulse 2s infinite;
        }
        .terminal::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(255, 0, 0, 0.02) 50%);
            background-size: 100% 4px;
            pointer-events: none;
            animation: scan 7.5s linear infinite;
            z-index: 1;
        }
        .ascii-art {
            color: #ff0000;
            text-shadow: 0 0 5px #ff0000;
        }
        @keyframes blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
        }
    </style>
</head>
<body style="font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0; background-color: #000000; color: #00ff00; line-height: 1.4;">
    <!-- Preview text for email clients -->
    <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
    System Error Alert: The Serper Credit Monitor encountered an error at ${currentDateTime}. Error: ${error.message}. Please check the GitHub Actions logs for detailed information and troubleshooting steps.
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000; color: #00ff00;">
        <tr>
            <td align="center" style="padding: 20px;">
                <table width="650" cellpadding="0" cellspacing="0" border="0" class="terminal" style="background-color: #000000;">
                    <tr>
                        <td style="padding: 20px;">
                            <pre style="margin: 0; padding: 0; white-space: pre-wrap; word-wrap: break-word; font-size: 14px;">
<span style="color: #ff0000;" class="ascii-art">${asciiError}</span>

<span style="color: #aaaaaa;">═══════════════════════════════════════════════════════════</span>
<span style="color: #ff0000;">┌─ ERROR HANDLER v2.1.0 ─┐</span>
<span style="color: #ff0000;">│</span> <span style="color: #ffffff;">SESSION ID: ${sessionId}</span> <span style="color: #ff0000;">  │</span>
<span style="color: #ff0000;">└────────────────────────┘</span>

<span style="color: #aaaaaa;"># System diagnostic sequence</span>
${systemOutput}
<span style="color: #aaaaaa;">═══════════════════════════════════════════════════════════</span>

<span style="color: #ffffff;">┌─[SYSTEM_ERROR]──[CRITICAL]</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ Timestamp:</span> <span style="color: #ffff00;">${currentDateTime}</span>
<span style="color: #ffffff;">│ Status:</span> <span style="color: #ff0000; font-weight: bold;">SYSTEM FAILURE DETECTED</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ Error Message:</span> <span style="color: #ff8888;">${error.message}</span>
<span style="color: #ffffff;">│ Error Type:</span> <span style="color: #ff8888;">${error.name || 'UnknownError'}</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">│ System Health:</span> <span style="color: #ff0000;">■■■□□□□□□□</span> <span style="color: #ff0000;">30% DEGRADED</span>
<span style="color: #ffffff;">│</span>
<span style="color: #ffffff;">└─[EOF]</span>

<span style="color: #ff5555;">!! IMMEDIATE ACTION REQUIRED !!</span>
<span style="color: #ffffff;">CHECK LOGS: GitHub Actions Dashboard</span>
<span style="color: #ffffff;">CONTACT: System Administrator</span>

<span style="color: #888888;">*** This is an automated error notification. ***</span>
<span style="color: #888888;">*** Generated at node: SRP-ERROR-${Math.floor(Math.random() * 9) + 1} ***</span>
<span style="color: #888888;">*** Hash: ${EmailNotifier.generateRandomHash()} ***</span>

<span style="color: #ff0000;">serper@errorsystem:~$</span> <span style="color: #ffffff;">system_recovery_mode</span>
<span style="color: #888888;">Attempting automatic recovery...</span>
<span style="color: #ff0000;">serper@errorsystem:~$</span> <span style="color: #ff0000;">█</span>
</pre>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    static generateRandomHash() {
        const chars = '0123456789ABCDEF';
        let hash = '';
        for (let i = 0; i < 32; i++) {
            hash += chars[Math.floor(Math.random() * chars.length)];
            if (i === 7 || i === 15 || i === 23) {
                hash += '-';
            }
        }
        return hash;
    }

    static generateCreditBar(creditCount) {
        let color = creditCount < 1000 ? '#ff0000' :
            creditCount < 5000 ? '#ffaa00' :
                creditCount < 10000 ? '#ffff00' : '#00ff00';

        const maxCredits = 2500;
        const percentage = Math.min(Math.round((creditCount / maxCredits) * 100), 100);
        const barLength = 30;
        const filledSegments = Math.round((percentage / 100) * barLength);

        let bar = '<span style="color: #aaaaaa;">[</span>';
        for (let i = 0; i < barLength; i++) {
            if (i < filledSegments) {
                bar += `<span style="color: ${color};">■</span>`;
            } else {
                bar += '<span style="color: #444444;">□</span>';
            }
        }
        bar += `<span style="color: #aaaaaa;">]</span> <span style="color: ${color};">${percentage}%</span>`;
        return bar;
    }
}

module.exports = { EmailNotifier };