const { getSerperCredits } = require('./scraper');
const { EmailNotifier } = require('./emailNotifier');
const fs = require('fs').promises;
const path = require('path');

// File to store credit history
const CREDIT_HISTORY_FILE = 'credit_history.json';

async function loadCreditHistory() {
    try {
        const data = await fs.readFile(CREDIT_HISTORY_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // If file doesn't exist or is corrupted, return empty history
        return {
            lastCredits: null,
            lastDailyReport: null,
            significantDropAlerts: [],
            lastHourlyCheck: null
        };
    }
}

async function saveCreditHistory(history) {
    try {
        await fs.writeFile(CREDIT_HISTORY_FILE, JSON.stringify(history, null, 2));
    } catch (error) {
        console.error('Failed to save credit history:', error);
    }
}

function shouldSendHourlyAlert(currentCredits, history) {
    const now = new Date();
    const currentHour = now.getHours();

    // Don't send hourly alerts during night hours (22:00 - 06:00 SAST)
    if (currentHour >= 22 || currentHour < 6) {
        return { shouldAlert: false, reason: 'Outside monitoring hours' };
    }

    // Always alert if credits are critically low (< 100)
    if (currentCredits < 100) {
        return {
            shouldAlert: true,
            reason: 'Critical credits level',
            alertType: 'critical'
        };
    }

    // Check for significant drops
    if (history.lastCredits) {
        const creditDrop = history.lastCredits - currentCredits;
        const dropPercentage = (creditDrop / history.lastCredits) * 100;

        // Alert if credits dropped by more than 30% or more than 500 credits
        if (creditDrop > 500 || dropPercentage > 30) {
            // Check if we already alerted for a similar drop today
            const today = now.toDateString();
            const todayAlerts = history.significantDropAlerts.filter(alert =>
                new Date(alert.date).toDateString() === today
            );

            // Don't spam - only alert once per significant drop per day
            if (todayAlerts.length === 0) {
                return {
                    shouldAlert: true,
                    reason: `Significant drop: ${creditDrop} credits (${dropPercentage.toFixed(1)}%)`,
                    alertType: 'significant_drop',
                    dropAmount: creditDrop,
                    dropPercentage: dropPercentage
                };
            }
        }
    }

    // Alert if credits are in warning zone and dropping
    if (currentCredits < 500 && history.lastCredits && currentCredits < history.lastCredits) {
        return {
            shouldAlert: true,
            reason: 'Credits in warning zone and still dropping',
            alertType: 'warning_zone_drop'
        };
    }

    return { shouldAlert: false, reason: 'No significant change' };
}

async function main() {
    const checkType = process.env.CHECK_TYPE || 'auto';
    const now = new Date();

    console.log(`Starting Serper Credit Check (${checkType})...`, now.toISOString());

    try {
        // Load credit history
        const history = await loadCreditHistory();

        // Get current credit count
        console.log('Fetching credits from Serper...');
        const creditCount = await getSerperCredits();
        console.log(`Retrieved credit count: ${creditCount}`);

        const emailNotifier = new EmailNotifier();
        let emailSent = false;

        // Determine what type of notification to send
        if (checkType === 'daily' || checkType === 'force_alert') {
            // Send comprehensive daily report
            console.log('Sending daily email report...');
            await emailNotifier.sendCreditReport(creditCount);
            emailSent = true;

            // Update last daily report timestamp
            history.lastDailyReport = now.toISOString();

        } else if (checkType === 'hourly') {
            // Check if we should send an hourly alert
            const alertDecision = shouldSendHourlyAlert(creditCount, history);

            console.log(`Hourly check decision: ${alertDecision.reason}`);

            if (alertDecision.shouldAlert) {
                console.log('Sending hourly alert...');
                await emailNotifier.sendHourlyAlert(creditCount, alertDecision, history.lastCredits);
                emailSent = true;

                // Record this alert to prevent spam
                if (alertDecision.alertType === 'significant_drop') {
                    history.significantDropAlerts.push({
                        date: now.toISOString(),
                        creditDrop: alertDecision.dropAmount,
                        dropPercentage: alertDecision.dropPercentage,
                        fromCredits: history.lastCredits,
                        toCredits: creditCount
                    });

                    // Keep only last 7 days of alerts
                    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    history.significantDropAlerts = history.significantDropAlerts.filter(
                        alert => new Date(alert.date) > sevenDaysAgo
                    );
                }
            }
        }

        // Update credit history
        history.lastCredits = creditCount;
        history.lastHourlyCheck = now.toISOString();
        await saveCreditHistory(history);

        // Log results
        const statusEmoji = emailSent ? '📧' : '✅';
        console.log(`${statusEmoji} Credit check completed. Credits: ${creditCount}${emailSent ? ' (Email sent)' : ''}`);

    } catch (error) {
        console.error('❌ Error in credit check process:', error);

        // Send error notification email
        try {
            const emailNotifier = new EmailNotifier();
            await emailNotifier.sendErrorNotification(error);
            console.log('Error notification sent');
        } catch (emailError) {
            console.error('Failed to send error notification:', emailError);
        }

        // Exit with error code for GitHub Actions
        process.exit(1);
    }
}

// Run the main function
if (require.main === module) {
    main();
}

module.exports = { main };