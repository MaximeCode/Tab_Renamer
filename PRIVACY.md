# Privacy Policy - Custom Tab Name

**Last Updated:** January 25, 2026

## Introduction

Custom Tab Name ("we", "our", or "the extension") is committed to protecting your privacy. This Privacy Policy explains how our Chrome extension handles your data.

## Data Collection

**We do NOT collect any personal data.**

Custom Tab Name does not:

- Collect any personal information
- Track your browsing history
- Monitor your activity
- Send any data to external servers
- Use analytics or tracking tools
- Share any information with third parties

## Data Storage

### What We Store

The extension stores the following data **locally on your device only**:

1. **Custom tab names** you create
2. **URL patterns** (exact or prefix) associated with your custom names
3. **Language preference** (English or French)
4. **Developer mode settings** (phpMyAdmin detection on/off)

### Where Data Is Stored

All data is stored using Chrome's **Sync Storage API**, which means:

- Data is stored in your Chrome browser profile
- Data can sync across your devices if you're signed into Chrome with sync enabled
- Data is stored locally in: `DevTools → Application → Storage → Extension storage → Custom Tab Name`
- **No external servers are involved**

### Data Retention

- Your custom tab names are stored **indefinitely** until you:
  - Manually delete them using the "Reset" button
  - Uninstall the extension
  - Clear your Chrome extension data

## Chrome Sync

If you have Chrome Sync enabled in your Google account settings:

- Your custom tab names may sync to other devices where you're signed into Chrome
- This is a Chrome feature controlled by Google, not by our extension
- You can disable Chrome Sync in Chrome Settings → Sync and Google Services
- Data synced through Chrome is subject to [Google's Privacy Policy](https://policies.google.com/privacy)

## Permissions Explained

Our extension requests the following permissions:

### Required Permissions

1. **`storage`**
   - **Why:** To save your custom tab names locally
   - **Usage:** Stores tab name configurations in Chrome's storage

2. **`activeTab`**
   - **Why:** To rename the current active tab
   - **Usage:** Reads the current tab's URL and updates its title

3. **`tabs`**
   - **Why:** To access and modify tab titles
   - **Usage:** Allows renaming of tabs you choose to rename

4. **`scripting`**
   - **Why:** To inject the renaming script into web pages
   - **Usage:** Enables dynamic title changes on tabs

5. **`<all_urls>` (Host Permissions)**
   - **Why:** To work on any website you visit
   - **Usage:** Allows the extension to rename tabs on any domain

### What We DON'T Do With These Permissions

- We don't read the content of web pages
- We don't track which websites you visit
- We don't modify website content (except the browser tab title)
- We don't send any data from websites to external servers

## Third-Party Services

**We do not use any third-party services.**

- No analytics (e.g., Google Analytics)
- No crash reporting tools
- No advertising networks
- No external APIs
- No cloud storage providers

## phpMyAdmin Detection

When "Developer Mode: DB" is enabled:

- The extension reads the current tab's URL to detect phpMyAdmin database and table names
- This analysis happens **entirely locally** in your browser
- No URL data is sent to any server
- Detection is performed only when the feature is explicitly enabled by you

## Children's Privacy

Our extension does not knowingly collect information from children under 13 years of age. The extension is designed for general productivity use and does not target children.

## Open Source

Custom Tab Name is open source software:

- Source code is available on GitHub: [github.com/MaximeCode/Tab_Renamer](https://github.com/MaximeCode/Tab_Renamer)
- You can review the code to verify our privacy claims
- Community contributions are welcome and audited

## Your Rights

You have complete control over your data:

### Access Your Data

- View all stored tab names in Chrome DevTools:
  - Press F12 → Application tab → Storage → Extension storage → Custom Tab Name

### Delete Your Data

- Use the "Reset" button in the extension popup to delete a specific tab name
- Uninstall the extension to delete all data
- Clear extension data in Chrome: `chrome://extensions/` → Extension details → "Remove extension"

### Export Your Data

- Currently, there is no built-in export feature
- You can view data in DevTools and manually copy it

## Changes to This Privacy Policy

We may update this Privacy Policy from time to time. Changes will be:

- Posted on our GitHub repository
- Updated in the Chrome Web Store listing
- Noted with a "Last Updated" date at the top

Continued use of the extension after changes constitutes acceptance of the updated policy.

## Data Breach Notification

Since we don't collect or store data on external servers, there is no risk of a data breach involving our servers. Your data exists only on your local device.

## Contact Us

If you have questions about this Privacy Policy:

- **GitHub Issues:** [github.com/MaximeCode/Tab_Renamer/issues](https://github.com/MaximeCode/Tab_Renamer/issues)
- **Email:** [contact.mbaude@gmail.com]
- **Chrome Web Store:** Leave a comment on the extension page

## Legal Basis (GDPR Compliance)

For users in the European Union:

- **Legal Basis:** Legitimate interest in providing tab organization functionality
- **Data Processing:** All data processing happens locally on your device
- **No Profiling:** We do not create user profiles or perform automated decision-making
- **Data Controller:** Maxime BAUDE (@MaximeCode)

## Summary

**In plain English:**

✅ Your data stays on your device  
✅ No tracking or analytics  
✅ No external servers  
✅ You control everything  
✅ Open source - you can verify  

❌ We don't collect anything  
❌ We don't share anything  
❌ We don't sell anything  
❌ We don't track anything  

---

**Custom Tab Name**
by Maxime BAUDE (@MaximeCode)
