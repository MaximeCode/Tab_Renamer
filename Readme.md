# 🏷️ Advanced Tab Renamer - Custom Names & Database Detection

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-blue)](https://chromewebstore.google.com/detail/custom-tab-name-smart-ren/lldbgogjfhiolnngankgodpjhbdijgoe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/MaximeCode/Tab_Renamer?style=social)](https://github.com/MaximeCode/Tab_Renamer)

Advanced tab renaming with URL patterns & database detection. Persistent storage. Bilingual (EN/FR). For developers & power users.

## ✨ Features

### 🎯 Smart URL Matching

- **Exact URL**: One page only — the field under the option is prefilled with the current tab URL but you can edit it to target any full URL
- **URL Starts With**: Every URL whose address starts with your prefix — same editable field (prefilled, customizable)
- **Regex**: Dedicated pattern field; invalid patterns are blocked before save (JavaScript `RegExp` syntax)
- **Match order**: Exact URL first, then Regex, then Dev DB mode, then prefix — so explicit rules win over broader ones
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

- **Rename rules** (`chrome.storage.sync`): Exact, prefix, regex, and DB-mode entries — synced across signed-in Chrome profiles where sync is enabled
- **Page helper** (`content.js`): Uses `chrome.storage.local` for a fast per-page cache; also resolves rules from sync (regex, prefix, DB) when there is no local exact entry
- **Survives Restarts**: Rules persist across browser sessions
- **No Data Loss**: Reliable Chrome storage API

### 🔄 Titles on dynamic sites (GitHub, phpMyAdmin, SPAs)

Many sites change `document.title` after load. The extension reapplies your name by:

- **Background**: After navigation or tab switch, looks up the matching rule and applies the title (message to the content script when available, otherwise injected script)
- **Enforcement**: A `MutationObserver` on the document plus a light periodic check so late title updates from the page do not permanently override your custom name
- **Reset**: Clearing a rule disconnects that enforcement so the tab can show the site’s title again

### 🎨 Clean UI

- Modern, intuitive popup interface
- Clear radio buttons for matching type selection
- One-click reset functionality

## Version 1.0.2

- **Custom URL fields**: Separate inputs for Exact URL and “URL starts with”, prefilled with the active tab’s URL but editable so you can target another address or prefix without switching tabs first.
- **Regex match type**: Third radio option with its own pattern field; patterns are validated before save.
- **Match priority**: Exact URL → Regex → Dev DB mode → Prefix, so a saved regex is not shadowed by DB auto-rules when both could apply.
- **Stronger title persistence**: Background + content script re-apply custom titles when sites update the tab title after load (common on GitHub, phpMyAdmin, and other SPAs).
- **Content script alignment**: `content.js` mirrors the same matching logic as the background worker and reads sync storage for regex / prefix / DB rules when no per-page local entry exists.
- **Manifest**: Extension version bumped to **1.0.2**.

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
3. Choose matching type and adjust the field under it if needed:
   - **"Exact URL"** (URL exacte) — full URL must match the value in the input (default: current tab)
   - **"URL Starts With"** (URL commence par) — tab URL must start with the prefix in the input (default: current tab)
   - **"Regex"** — tab URL must match the JavaScript regular expression you type in the regex field
4. Click **Renommer** / **Rename**
5. The new title applies immediately and is kept after refresh and when the site changes the title again

### Using Regex Patterns (Advanced)

Regex (regular expressions) allow powerful pattern matching for complex URL structures:

**How to use:**

1. Select the "Regex" radio option
2. An input field appears below
3. Enter your regex pattern (e.g., `localhost:\d+`)
4. Click "Renommer" to save

**Example patterns:**

- `^https:\/\/github\.com\/YourOrg\/[^\/]+\/?$` — e.g. one custom name for `https://github.com/YourOrg/Project-A`, `…/Project-B`, etc.
- `https://github\.com/.*/issues` - Match any GitHub issues page (list or specific issue)
- `localhost:\d+` - Match any localhost port (3000, 8080, etc.)
- `.*\.(jpg|png|gif)$` - Match any image file URL
- `https://.*\.example\.com` - Match any subdomain of example.com
- `phpmyadmin.*[?&]db=production(&|$)` - Match phpMyAdmin production database pages

**Validation:**

- The extension validates your pattern before saving
- Invalid regex shows: "❌ Expression régulière invalide"
- Pattern must be valid JavaScript regex syntax

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

| Matching Type   | Pattern/URL                                      | New Name        | Result                            |
| --------------- | ------------------------------------------------ | --------------- | --------------------------------- |
| Exact URL       | Current tab URL                                  | "Admin Panel"   | Only current tab renamed          |
| URL Starts With | Current tab URL                                  | "Dev Server"    | All URLs with same prefix renamed |
| Regex           | `localhost:\d+`                                  | "Local Dev"     | Matches `localhost:3000`, `:8080` |
| Regex           | `github\.com/.*/issues`                          | "GitHub Issues" | All GitHub issues pages           |
| Regex           | `phpmyadmin.*[?&]db=test1`                       | "DB: test1"     | phpMyAdmin test1 database pages   |
| Regex           | `.*\.(jpg\|png\|gif)$`                           | "Image"         | All image URLs                    |
| Regex           | `^https:\/\/github\.com\/user\/repo\/[^\/]+\/?$` | "My repo"       | Repo root + one path segment      |

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
├── template.html       # Layout reference / Chrome Web Store screenshot template
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
