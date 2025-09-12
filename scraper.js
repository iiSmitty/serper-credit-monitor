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

        // Enhanced credit extraction with validation and retry logic
        console.log('Looking for credits (waiting for data to load)...');

        const creditCount = await extractCreditsWithValidation(page);

        console.log(`Found credits: ${creditCount}`);
        return creditCount;

    } catch (error) {
        console.error('Error scraping Serper credits:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Enhanced credit extraction with validation and retry logic
 * This function implements multiple strategies to ensure accurate credit reading
 */
async function extractCreditsWithValidation(page) {
    const MAX_ATTEMPTS = 5;
    const VALIDATION_DELAY = 2000; // 2 seconds between validation attempts
    const SUSPICIOUS_THRESHOLD = 10; // Credits below this are considered suspicious

    console.log('Starting enhanced credit extraction...');

    // Wait for page to settle after login
    await page.waitForTimeout(3000);

    // Wait for the credits element to appear
    await page.waitForSelector('h2.chakra-heading.css-1quy9ws span', { timeout: 15000 });

    let validationAttempts = 0;
    let creditReadings = [];

    while (validationAttempts < MAX_ATTEMPTS) {
        validationAttempts++;
        console.log(`Credit validation attempt ${validationAttempts}/${MAX_ATTEMPTS}...`);

        // Wait a bit for any loading to complete
        await page.waitForTimeout(VALIDATION_DELAY);

        try {
            // Get the credit text
            const creditsText = await page.textContent('h2.chakra-heading.css-1quy9ws span');
            console.log(`Raw credit text (attempt ${validationAttempts}): "${creditsText}"`);

            // Extract numeric value from text (handle commas)
            const creditMatch = creditsText.match(/(\d{1,3}(?:,\d{3})*)/);
            if (!creditMatch) {
                console.log(`No numeric value found in text: "${creditsText}"`);
                continue;
            }

            const creditCount = parseInt(creditMatch[1].replace(/,/g, ''));
            creditReadings.push({
                attempt: validationAttempts,
                value: creditCount,
                rawText: creditsText
            });

            console.log(`Parsed credit value (attempt ${validationAttempts}): ${creditCount}`);

            // If this is a suspicious reading (very low credits), we need extra validation
            if (creditCount <= SUSPICIOUS_THRESHOLD) {
                console.log(`⚠️ Suspicious reading detected: ${creditCount} credits (very low)`);

                // For suspicious readings, take multiple samples
                if (validationAttempts < 3) {
                    console.log('Taking additional samples for suspicious reading...');
                    continue;
                }

                // Check if multiple suspicious readings are consistent
                const recentSuspicious = creditReadings
                    .slice(-3)
                    .filter(reading => reading.value <= SUSPICIOUS_THRESHOLD);

                if (recentSuspicious.length >= 2) {
                    const values = recentSuspicious.map(r => r.value);
                    const allSame = values.every(v => v === values[0]);

                    if (allSame) {
                        console.log(`✅ Suspicious reading validated: ${creditCount} credits (confirmed by ${recentSuspicious.length} consistent readings)`);
                        return creditCount;
                    } else {
                        console.log(`❌ Inconsistent suspicious readings: ${values.join(', ')}`);
                        continue;
                    }
                }
            }

            // For normal readings, validate with at least 2 attempts
            if (validationAttempts >= 2) {
                const recentReadings = creditReadings.slice(-2);

                // Check if the last two readings are consistent (within 5% or 100 credits)
                if (recentReadings.length >= 2) {
                    const [prev, current] = recentReadings.slice(-2);
                    const difference = Math.abs(current.value - prev.value);
                    const percentDifference = (difference / Math.max(current.value, prev.value)) * 100;

                    if (difference <= 100 || percentDifference <= 5) {
                        console.log(`✅ Credit reading validated: ${creditCount} credits (consistent with previous reading of ${prev.value})`);
                        return creditCount;
                    } else {
                        console.log(`❌ Inconsistent readings: ${prev.value} vs ${current.value} (difference: ${difference}, ${percentDifference.toFixed(1)}%)`);
                    }
                }
            }

        } catch (error) {
            console.log(`Error on attempt ${validationAttempts}:`, error.message);
        }
    }

    // If we get here, we couldn't get consistent readings
    console.log('All validation attempts completed. Analyzing results...');
    console.log('Credit readings:', creditReadings);

    if (creditReadings.length === 0) {
        throw new Error('Failed to extract any credit values after multiple attempts');
    }

    // Return the most common value, or the last non-zero value if available
    const nonZeroReadings = creditReadings.filter(r => r.value > 0);

    if (nonZeroReadings.length > 0) {
        // Use the most recent non-zero reading
        const bestReading = nonZeroReadings[nonZeroReadings.length - 1];
        console.log(`⚠️ Using most recent non-zero reading: ${bestReading.value} credits (from attempt ${bestReading.attempt})`);
        return bestReading.value;
    }

    // If all readings were zero/suspicious, we need to be more careful
    const allValues = creditReadings.map(r => r.value);
    const allZero = allValues.every(v => v === 0);

    if (allZero) {
        console.log('🚨 All readings were 0 - this might indicate a real issue or a persistent loading problem');
        // Still throw an error rather than return 0, as this is likely a false reading
        throw new Error('All credit extraction attempts returned 0 - this is likely a false reading due to loading issues');
    }

    // Use the most frequent value as fallback
    const frequencyMap = {};
    allValues.forEach(value => {
        frequencyMap[value] = (frequencyMap[value] || 0) + 1;
    });

    const mostFrequent = Object.keys(frequencyMap).reduce((a, b) =>
        frequencyMap[a] > frequencyMap[b] ? a : b
    );

    console.log(`⚠️ Using most frequent reading: ${mostFrequent} credits`);
    return parseInt(mostFrequent);
}

/**
 * Wrapper function with retry logic for the main credit extraction
 */
async function getSerperCreditsWithRetry(maxRetries = 2) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(`\n🔄 Credit extraction attempt ${attempt}/${maxRetries}`);

        try {
            const credits = await getSerperCredits();

            // Additional sanity check: if we get 0 and this is not the final attempt, retry
            if (credits === 0 && attempt < maxRetries) {
                console.log('⚠️ Got 0 credits, attempting retry...');
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                continue;
            }

            return credits;
        } catch (error) {
            lastError = error;
            console.error(`❌ Attempt ${attempt} failed:`, error.message);

            if (attempt < maxRetries) {
                console.log(`⏳ Waiting before retry attempt ${attempt + 1}...`);
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between retries
            }
        }
    }

    throw new Error(`Failed to get credits after ${maxRetries} attempts. Last error: ${lastError.message}`);
}

module.exports = {
    getSerperCredits,
    getSerperCreditsWithRetry
};