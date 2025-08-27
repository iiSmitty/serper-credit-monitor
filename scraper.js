const { chromium } = require('playwright');
require('dotenv').config();

async function getSerperCredits() {
    let browser;

    try {
        // Launch browser with stealth settings
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();

        // Navigate to login page
        console.log('Navigating to Serper login...');
        await page.goto('https://serper.dev/login', { waitUntil: 'networkidle' });

        // Fill in login credentials with robust approach
        const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
        const passwordInput = await page.locator('input[type="password"], input[name="password"]').first();

        // Email
        await emailInput.click();
        await emailInput.clear();
        await emailInput.pressSequentially(process.env.SERPER_EMAIL, { delay: 100 });

        // Password with special character handling
        await passwordInput.click();
        await passwordInput.clear();
        await page.waitForTimeout(500);

        // Try pressSequentially first (best for special characters)
        try {
            await passwordInput.pressSequentially(process.env.SERPER_PASSWORD, { delay: 200 });
            const passwordValue = await passwordInput.inputValue();

            if (passwordValue.length !== process.env.SERPER_PASSWORD.length) {
                throw new Error('Length mismatch');
            }
        } catch (e) {
            // Fallback: Use keyboard typing character by character
            await passwordInput.focus();
            await page.keyboard.press('Control+A');
            for (let char of process.env.SERPER_PASSWORD) {
                await page.keyboard.type(char);
                await page.waitForTimeout(100);
            }
        }

        // Click login button and wait for navigation
        const submitButton = await page.locator('button:has-text("Sign in"), button[type="submit"], button:has-text("Log in")').first();

        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle' }),
            submitButton.click()
        ]);

        console.log('Logged in successfully');

        // Credits should be visible after login, but navigate to dashboard if needed
        const currentUrl = page.url();
        if (!currentUrl.includes('dashboard') && !await page.locator('text=Credits left').isVisible().catch(() => false)) {
            await page.goto('https://serper.dev/dashboard', { waitUntil: 'networkidle' });
        }

        // Wait for and extract credit information using the discovered selector
        console.log('Looking for credits (waiting for data to load)...');

        // Wait for page to settle after login
        await page.waitForTimeout(2000);

        // Wait for the credits element to appear
        await page.waitForSelector('h2.chakra-heading.css-1quy9ws span', { timeout: 15000 });

        // Wait for the credit value to actually load (not just "0")
        let credits = '';
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts) {
            credits = await page.textContent('h2.chakra-heading.css-1quy9ws span');

            // Check if we have a meaningful credit value (not "0" or empty)
            if (credits && credits.trim() !== "0" && credits.trim() !== "") {
                break;
            }

            attempts++;
            await page.waitForTimeout(1000);
        }

        // Extract numeric value from text (handle commas)
        const creditMatch = credits.match(/(\d{1,3}(?:,\d{3})*)/);
        const creditCount = creditMatch ? creditMatch[1].replace(/,/g, '') : 'Unknown';

        console.log(`Found credits: ${creditCount} (raw text: "${credits}")`);
        return parseInt(creditCount) || 0;

    } catch (error) {
        console.error('Error scraping Serper credits:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = { getSerperCredits };