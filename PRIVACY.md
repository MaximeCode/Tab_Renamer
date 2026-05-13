# Privacy Policy — Advanced Tab Renamer

**Last Updated:** May 13, 2026

## Introduction

Advanced Tab Renamer ("the extension") is committed to protecting your privacy. This policy explains how the extension handles your data.

## Data Collection

**We do not collect any personal data.**

The extension does not:

- Collect personal information
- Track your browsing history or activity
- Send any data to external servers
- Use analytics or tracking tools
- Share any information with third parties

## Data Storage

### What is stored

The extension stores the following data **locally on your device only**:

1. **Custom tab names** you create
2. **Custom favicon images** (stored as base64-encoded PNG, max 32×32 px)
3. **URL patterns** (exact URL, prefix, or regex) associated with your rules
4. **Language preference** (English or French)
5. **Developer Mode setting** (phpMyAdmin DB detection)

### Where data is stored

All data is stored using **`chrome.storage.sync`**:

- Data lives inside your Chrome browser profile
- If Chrome Sync is enabled in your Google account, data may sync across your signed-in devices
- Data is never sent to any server operated by this extension
- You can inspect it at any time: DevTools → Application → Storage → Extension storage

### Data retention

Your rules are stored indefinitely until you:
- Use the **Reset** button in the popup to delete a specific rule
- Uninstall the extension
- Clear Chrome extension data manually

## Chrome Sync

If Chrome Sync is enabled:
- Your rules may sync to other devices where you are signed into Chrome
- This is a Chrome feature controlled entirely by Google, not by this extension
- It is subject to [Google's Privacy Policy](https://policies.google.com/privacy)
- You can disable sync at: Chrome Settings → Sync and Google Services

## Permissions Explained

| Permission   | Why it is needed                                                         |
| ------------ | ------------------------------------------------------------------------ |
| `storage`    | Save and retrieve your rename rules and favicon data locally             |
| `activeTab`  | Read the current tab's URL to pre-fill the popup and apply rules         |
| `tabs`       | Detect tab navigation and re-apply rules after page loads                |
| `scripting`  | Inject the content script to enforce custom titles and favicons on pages |
| `<all_urls>` | Allow the extension to work on any website you choose to rename          |

### What these permissions do NOT allow

- Reading or exfiltrating web page content
- Tracking which websites you visit
- Modifying any part of a web page other than its title and favicon link tag
- Sending data to any external server

## Third-Party Services

**None.** The extension uses no analytics, crash reporting, advertising networks, external APIs, or cloud storage.

## phpMyAdmin / Developer Mode

When "Developer Mode: DB" is enabled:

- The extension reads the current tab's URL to extract database and table names from query parameters (`db=`, `table=`, etc.)
- This analysis runs entirely locally inside your browser
- No URL data is ever transmitted outside your device

## Children's Privacy

This extension is designed for general developer productivity use. It does not knowingly collect information from children under 13 years of age.

## Open Source

Advanced Tab Renamer is open source:

- Source code: [github.com/MaximeCode/Tab_Renamer](https://github.com/MaximeCode/Tab_Renamer)
- You can audit the code to verify every claim in this policy

## Your Rights & Data Control

| Action           | How to do it                                                               |
| ---------------- | -------------------------------------------------------------------------- |
| View stored data | DevTools (F12) → Application → Extension storage → Advanced Tab Renamer    |
| Delete one rule  | Click **Reset** in the extension popup on the relevant tab                 |
| Delete all data  | Uninstall the extension, or clear extension data in `chrome://extensions/` |

There is currently no built-in bulk export feature. Data can be copied manually from DevTools.

## GDPR (EU Users)

- **Legal basis:** Legitimate interest in providing tab organisation functionality
- **Data processing:** Entirely local — no data leaves your device via this extension
- **No profiling:** No user profiles or automated decision-making
- **Data controller:** Maxime BAUDE (@MaximeCode)

## Changes to This Policy

Updates will be:
- Committed to the GitHub repository with a changelog entry
- Reflected in the Chrome Web Store listing
- Marked with an updated "Last Updated" date at the top of this file

Continued use of the extension after a policy change constitutes acceptance of the updated policy.

## Contact

- **GitHub Issues:** [github.com/MaximeCode/Tab_Renamer/issues](https://github.com/MaximeCode/Tab_Renamer/issues)
- **Email:** [contact.mbaude@gmail.com](mailto:contact.mbaude@gmail.com)
- **Chrome Web Store:** Leave a comment on the extension listing page

---

**In plain English:**

✅ Your data stays on your device  
✅ No tracking, no analytics, no ads  
✅ No external servers  
✅ You control everything — delete anytime  
✅ Open source — every line is auditable  

❌ We don't collect anything  
❌ We don't share anything  
❌ We don't sell anything  

---

*Advanced Tab Renamer — by Maxime BAUDE ([@MaximeCode](https://github.com/MaximeCode))*
