# Serper Credit Monitor 🤖

Automated daily monitoring of your Serper API credits with intelligent email notifications. Never run out of credits unexpectedly again!

## Features ✨

- **Daily Reports**: Comprehensive credit status emails every morning at 06:00 SAST
- **Smart Hourly Monitoring**: Intelligent alerts during business hours (08:00-20:00 SAST)
- **Beautiful Email Templates**: Professional HTML emails with status indicators
- **Multiple Alert Types**:
    - 🚨 Critical alerts (< 100 credits)
    - ⚠️ Warning alerts (< 500 credits)
    - 📉 Significant drop alerts (30% or 500+ credit drops)
- **GitHub Actions Integration**: Fully automated with no server maintenance
- **Error Notifications**: Get notified if the monitoring system fails
- **Anti-spam Logic**: Smart alerting to prevent notification overload

## Quick Setup 🚀

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd serper-credit-monitor
npm install
npx playwright install chromium
```

### 2. Local Testing Setup
Create a `.env` file in the project root:
```env
SERPER_EMAIL=your-serper-email@example.com
SERPER_PASSWORD=your-serper-password
GMAIL_EMAIL=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
RECIPIENT_EMAIL=your-notification-email@example.com
```

### 3. Test Your Setup
Create a `test.js` file in your project root:
```javascript
// This tests your complete production setup
const { main } = require('./index');

console.log('🚀 Final System Test - Production Ready Check');
console.log('===============================================');
console.log('This will run your complete automation once to verify everything works.');
console.log('');

main()
    .then(() => {
        console.log('');
        console.log('🎉 SUCCESS! Your automation is ready for deployment!');
        console.log('');
        console.log('Next Steps:');
        console.log('1. Commit all files to your GitHub repository');
        console.log('2. Add the GitHub secrets listed in setup guide');
        console.log('3. Run the GitHub Action manually to test');
        console.log('4. Customize the schedule in GitHub Actions to your liking');
        console.log('');
        console.log('Your daily credit monitoring is now fully automated! 🎯');
    })
    .catch(error => {
        console.log('');
        console.log('❌ System test failed. Check the error above and fix before deploying.');
        console.log('');
        process.exit(1);
    });
```

Then run the test:
```bash
# Test the complete system
node test.js
```

### 4. Configure GitHub Secrets
Add these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SERPER_EMAIL` | Your Serper.dev login email | `user@example.com` |
| `SERPER_PASSWORD` | Your Serper.dev password | `your-password` |
| `GMAIL_EMAIL` | Gmail address for sending notifications | `monitor@gmail.com` |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not regular password) | `abcd efgh ijkl mnop` |
| `RECIPIENT_EMAIL` | Where to send notifications | `alerts@example.com` |

### 5. Enable GitHub Actions
The automation runs automatically once you push to your repository. You can also trigger it manually:
- Go to `Actions` tab in your GitHub repository
- Select "Serper Credit Monitoring"
- Click "Run workflow"

## Email Setup 📧

### Gmail App Password Setup
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to Security > 2-Step Verification (must be enabled)
3. Click "App passwords"
4. Generate a password for "Mail"
5. Use this 16-character password (not your regular Gmail password)

### Email Recipients
- **Current limitation**: The system is configured to work with Gmail SMTP
- **Recipients**: You can send to any email address by setting `RECIPIENT_EMAIL`
- **From address**: Must be a Gmail account with App Password enabled

## Monitoring Schedule 📅

### Automatic Schedule
- **Daily Report**: 06:00 AM SAST (04:00 UTC) - Comprehensive status
- **Hourly Checks**: 08:00-20:00 SAST (06:00-18:00 UTC) - Smart alerts only
- **Night Mode**: No alerts between 22:00-06:00 SAST (monitoring paused)

### Manual Triggers
You can manually run different check types:
- `auto` - Let the system decide based on time
- `daily` - Force a daily report
- `hourly` - Run hourly check logic
- `force_alert` - Force send an alert regardless of conditions

## Alert Logic 🧠

### When You'll Get Alerts
1. **Critical Level**: < 100 credits remaining
2. **Warning Level**: < 500 credits remaining (daily reports only)
3. **Significant Drop**: > 30% decrease or 500+ credits dropped
4. **Continued Decline**: Credits in warning zone and still dropping

### Anti-Spam Features
- Only one significant drop alert per day
- No alerts during night hours (22:00-06:00 SAST)
- Smart detection prevents duplicate notifications

## File Structure 📁

```
serper-credit-monitor/
├── index.js              # Main orchestration logic
├── scraper.js            # Playwright-based Serper scraping
├── emailNotifier.js      # Email template & sending logic
├── test.js               # Local testing script (create from README)
├── package.json          # Dependencies
├── .github/
│   └── workflows/
│       └── daily-credit-check.yml  # GitHub Actions workflow
├── .gitignore
├── .env                  # Local environment (create yourself)
└── README.md
```

## Testing 🧪

### Local Testing
```bash
# Full system test
node test.js

# Test individual components
npm test
```

### GitHub Actions Testing
1. Push your code to GitHub
2. Go to Actions tab
3. Run "Serper Credit Monitoring" workflow manually
4. Check the logs and your email

## Troubleshooting 🔧

### Common Issues

**"Login failed" errors**:
- Verify your Serper credentials in GitHub secrets
- Check if Serper.dev changed their login page structure

**"Email sending failed"**:
- Ensure Gmail App Password is correctly set (not regular password)
- Verify 2-Step Verification is enabled on Gmail
- Check RECIPIENT_EMAIL format

**"No credits found"**:
- Serper might have changed their dashboard layout
- Check if you're logged into the correct account

**GitHub Actions not running**:
- Verify the workflow file is in `.github/workflows/`
- Check if all required secrets are set
- Look at Actions tab for error details

### Debug Mode
Set `CHECK_TYPE=force_alert` to force an email and test the complete flow.

## Customization 🎨

### Modify Alert Thresholds
Edit the conditions in `index.js` function `shouldSendHourlyAlert()`:
```javascript
// Critical level (currently 100)
if (currentCredits < 100) { ... }

// Warning level (currently 500) 
if (currentCredits < 500) { ... }
```

### Change Monitoring Hours
Update the cron schedule in `.github/workflows/daily-credit-check.yml`:
```yaml
# Current: 06:00-18:00 UTC (08:00-20:00 SAST)
- cron: '0 6,7,8,9,10,11,12,13,14,15,16,17,18 * * *'
```

### Email Templates
Customize the HTML/CSS in `emailNotifier.js` methods:
- `generateHtmlEmail()` - Daily reports
- `generateHourlyAlertHtml()` - Alert emails

## Credits & License 📄

- **Playwright**: Web scraping automation
- **Nodemailer**: Email delivery
- **GitHub Actions**: Free automation hosting

MIT License - Feel free to modify and distribute!

## Support 💬

If you encounter issues:
1. Check the troubleshooting section above
2. Review GitHub Actions logs in your repository
3. Test locally first with `node test.js`
4. Verify all secrets are correctly set in GitHub

---

**⭐ Star this repo if it saves you from credit surprises!**