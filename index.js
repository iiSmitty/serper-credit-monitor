const { getSerperCredits } = require('./scraper');
const { EmailNotifier } = require('./emailNotifier');

async function main() {
    console.log('Starting Serper Credit Check...', new Date().toISOString());

    try {
        // Get credit count from Serper
        console.log('Fetching credits from Serper...');
        const creditCount = await getSerperCredits();
        console.log(`Retrieved credit count: ${creditCount}`);

        // Send email notification
        console.log('Sending email notification...');
        const emailNotifier = new EmailNotifier();
        await emailNotifier.sendCreditReport(creditCount);
        console.log('Email sent successfully!');

        // Log success
        console.log(`✅ Credit check completed successfully. Credits: ${creditCount}`);

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