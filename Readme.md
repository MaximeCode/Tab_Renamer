# 🏷️ Advanced Tab Renamer - Custom Names & Database Detection

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-blue)](https://chromewebstore.google.com/detail/custom-tab-name-smart-ren/lldbgogjfhiolnngankgodpjhbdijgoe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/MaximeCode/Tab_Renamer?style=social)](https://github.com/MaximeCode/Tab_Renamer)

Advanced tab renaming with URL patterns & database detection. Persistent storage. Bilingual (EN/FR). For developers & power users.

## ✨ Features

### 🎯 Smart URL Matching

- **Exact URL Match**: Rename only the specific page
- **URL Starts With**: Apply custom names to all pages under a path
- Perfect for organizing multiple tabs from the same domain

### 🗄️ Developer Mode: phpMyAdmin Integration

- **Auto-detection**: Automatically detects database and table names
- **Smart Formatting**: Renames tabs as "DB: database_name | Table: table_name"
- **Time-saver**: No manual input needed for database work

### 🌍 Bilingual Interface

- **English & French**: Full localization support
- **Instant Toggle**: Switch languages with FR/EN buttons
- **Persistent Choice**: Language preference saved

### 💾 Persistent Storage

- **Browser Storage**: All custom names saved locally
- **Survives Restarts**: Names persist across browser sessions
- **No Data Loss**: Reliable Chrome storage API

### 🎨 Clean UI

- Modern, intuitive popup interface
- Clear radio buttons for matching type selection
- One-click reset functionality

## Version 1.0.1

- Database detection added, when you are on a phpMyAdmin page, the extension will automatically detect the database and table names and propose to rename the tab accordingly.

## 🚀 Installation

### From Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store page](https://chromewebstore.google.com/detail/custom-tab-name-smart-ren/lldbgogjfhiolnngankgodpjhbdijgoe)
2. Click "Add to Chrome"
3. Confirm the installation
4. You're ready to go!

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `tab-renamer` folder
6. The extension is now installed!

## 📖 Usage

### Basic Tab Renaming

1. Click the Advanced Tab Renamer extension icon in your toolbar
2. Enter your custom title in the input field
3. Choose matching type:
   - **"Exact URL"** (URL exacte) - for this specific page only
   - **"URL Starts With"** (URL commence par) - for all pages under this path
4. Click "Renommer" (Rename) - done!
5. Your custom title appears immediately and persists forever

### Developer Mode: phpMyAdmin

For phpMyAdmin users:

1. Check the **"Mode Dev : DB"** checkbox
2. Navigate to any phpMyAdmin page
3. The extension automatically detects:
   - Current database name
   - Current table name (if viewing a table)
4. Tab is auto-renamed with format: `DB: mydb | Table: users`
5. No manual input needed!

### Language Switching

- Click **FR** for French interface
- Click **EN** for English interface
- Language preference is saved automatically

### Use Cases

**For Developers:**

- Organize localhost ports: `localhost:3000` → "Frontend Dev"
- Label API endpoints: `api.example.com/v1` → "API V1"
- Distinguish environments: `staging.app.com` → "Staging Server"
- phpMyAdmin databases: Auto-labeled with DB and table names

**For Productivity:**

- Multiple Google Docs: "Q4 Report", "Meeting Notes", "Budget 2025"
- Email accounts: "Work Gmail", "Personal Gmail"
- Admin panels: "Client A Dashboard", "Client B Analytics"
- Research tabs: "AI Research", "Competition Analysis"

**For Professionals:**

- Screenshot preparation: Rename tabs for clean, professional captures
- Client presentations: Remove technical URLs from visible tabs
- Training materials: Label tabs with clear, descriptive names
- Multi-account management: Distinguish between different user sessions

**URL Matching Examples:**

| Original URL               | Matching Type | New Name       | Result                         |
| -------------------------- | ------------- | -------------- | ------------------------------ |
| `localhost:3000/admin`     | Exact         | "Admin Panel"  | Only `/admin` renamed          |
| `localhost:3000`           | Starts With   | "Dev Server"   | All `localhost:3000/*` renamed |
| `docs.google.com/d/abc123` | Exact         | "Project Plan" | Only this doc renamed          |
| `github.com/MaximeCode`    | Starts With   | "My GitHub"    | All your repos renamed         |

## 🛠️ Development

This project is built with vanilla JavaScript for Chrome extensions.

### File Structure

```text
tab-renamer/
├── manifest.json       # Extension configuration
├── background.js       # Background service worker
├── content.js          # Content script for web pages
├── popup.html          # Popup UI markup
├── popup.js            # Popup UI logic
├── template.html       # Template for the popup
├── icon16.png          # Extension icon (16x16)
├── icon48.png          # Extension icon (48x48)
├── icon128.png         # Extension icon (128x128)
├── LICENSE             # MIT License
├── PRIVACY.md          # Privacy Policy
└── README.md           # This file
```

### Technologies Used

- **Manifest V3**: Latest Chrome extension manifest version
- **Chrome Storage API**: For persistent tab name storage
- **Chrome Tabs API**: For tab manipulation
- **Vanilla JavaScript**: No frameworks, pure JS

### Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Privacy Policy

Advanced Tab Renamer respects your privacy:

- **No data collection**: We don't collect any personal information
- **No external servers**: All data is stored locally on your device
- **No tracking**: No analytics or tracking scripts
- **Open source**: You can review all the code on GitHub

Full privacy policy available at: [PRIVACY.md](PRIVACY.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who help improve this extension
- Built for developers, by a developer
- Inspired by the need for better tab organization in modern workflows

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/MaximeCode/Tab_Renamer/issues)
- **Email**: [contact.mbaude@gmail.com]
- **Chrome Web Store**: [Leave a review](https://chromewebstore.google.com/detail/custom-tab-name-smart-ren/lldbgogjfhiolnngankgodpjhbdijgoe)

---

Made with ❤️ by [Maxime BAUDE](https://github.com/MaximeCode)

If you find this extension helpful, consider ⭐ starring the repository!

**Advanced Tab Renamer** - Professional tab organization for developers and power users.
