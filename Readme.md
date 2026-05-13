# 🏷️ Advanced Tab Renamer — Custom Names, Icons & Database Detection

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-v2.0.0-blue)](https://chromewebstore.google.com/detail/advanced-tab-renamer-cust/lldbgogjfhiolnngankgodpjhbdijgoe?hl=fr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/MaximeCode/Tab_Renamer?style=social)](https://github.com/MaximeCode/Tab_Renamer)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen)](https://developer.chrome.com/docs/extensions/mv3/)

> Rename any browser tab and set a custom favicon — by exact URL, prefix, or regex pattern. Includes automatic phpMyAdmin DB/table detection. Persistent sync storage. Bilingual EN/FR. Built for developers and power users.

---

## ✨ Features

### 🏷️ Tab Renaming

Give any tab a meaningful name instead of staring at generic page titles. Your names persist across page reloads, browser restarts, and even on dynamic single-page apps that change the title after load.

### 🎨 Custom Favicon

Upload any image (PNG, JPG, GIF, WebP…) and the extension resizes it to 32×32 and sets it as the tab's favicon. Works independently from renaming — you can change the name only, the icon only, or both at once.

### 🎯 Smart URL Matching

Three matching modes give you full control over which tabs a rule applies to:

| Mode                | How it works                                     | Example                                  |
| ------------------- | ------------------------------------------------ | ---------------------------------------- |
| **Exact URL**       | Matches only the specific URL you enter          | `https://app.example.com/dashboard`      |
| **URL Starts With** | Matches every tab whose URL begins with a prefix | `https://localhost:3000`                 |
| **Regex**           | Full JavaScript regular expression               | `localhost:\d+` → matches any local port |

Match priority: **Exact URL → Regex → DB mode → Prefix** — explicit rules always win over broad ones.

### 🗄️ Developer Mode: phpMyAdmin / DB Tools

When enabled, the extension automatically reads `db=` and `table=` from the current tab's URL and proposes a structured name like `DB: mydb | Table: users`. No typing required. Works with phpMyAdmin and any DB admin tool that uses standard URL parameters.

### 💾 Persistent Synced Storage

Rules are stored in `chrome.storage.sync` — they survive browser restarts and optionally sync across your signed-in Chrome profiles.

### 🔄 Dynamic Site Support

GitHub, phpMyAdmin, and most SPAs overwrite the tab title after the initial page load. The extension fights back with a `MutationObserver` on the `<title>` element and reapplication of rules on every tab navigation and activation.

### 🌍 Bilingual Interface

Full English and French UI. Switch instantly with the FR / EN buttons in the popup. Your language preference is saved automatically.

---

## 🚀 Installation

### From the Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store listing](https://chromewebstore.google.com/detail/advanced-tab-renamer-cust/lldbgogjfhiolnngankgodpjhbdijgoe?hl=fr)
2. Click **Add to Chrome**
3. Confirm — done

### Manual Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select the `Tab_Renamer` folder

---

## 📖 How to Use

### Rename a Tab

1. Navigate to the tab you want to rename
2. Click the **Advanced Tab Renamer** icon in your toolbar
3. Type a custom name in the input field
4. Choose a matching mode and adjust the URL field if needed
5. Click **Apply** — the title updates instantly and persists across reloads

### Set a Custom Favicon

In the same popup, click **Choose an image…** under "Custom favicon", select any image file, and click **Apply**. The image is automatically resized to 32×32 PNG.

### Reset

Click **Reset** to remove the rule and restore the original title and favicon.

### phpMyAdmin / DB Mode

Open any phpMyAdmin page. The extension auto-detects the database and table from the URL and pre-fills the name. Check **Mode Dev : DB** and click **Apply**.

### Regex Examples

| Pattern                   | Matches                                      |
| ------------------------- | -------------------------------------------- |
| `localhost:\d+`           | Any localhost port (`3000`, `8080`, `5173`…) |
| `github\.com/.*/issues`   | All GitHub issues pages                      |
| `phpmyadmin.*[?&]db=prod` | phpMyAdmin with `db=prod` in the URL         |
| `.*\.(jpg\|png\|gif)$`    | Any image file URL                           |
| `^https://staging\.`      | All staging subdomains                       |

---

## 🛠️ Development

Built with **vanilla JavaScript** — no bundler, no framework, no build step. Load the folder directly in Chrome developer mode.

### File Structure

```
Tab_Renamer/
├── manifest.json       # Extension config (Manifest V3)
├── background.js       # Service worker — rule matching, title & favicon persistence
├── content.js          # Content script — enforces title/favicon in page DOM
├── popup.html          # Popup UI markup
├── popup.js            # Popup UI logic
├── template.html       # Chrome Web Store screenshot template
├── icon16.png          # Toolbar icon 16×16
├── icon48.png          # Extensions page icon 48×48
├── icon128.png         # Web Store icon 128×128
├── LICENSE
├── PRIVACY.md
└── README.md
```

### Architecture Notes

- **Single source of truth:** `chrome.storage.sync` holds all rules. `chrome.storage.local` is no longer used (removed in v2.0.0 to fix a ghost-entry crash).
- **Title enforcement:** `content.js` uses a `MutationObserver` scoped to the `<title>` element only — narrow and safe, no risk of infinite feedback loops.
- **Favicon enforcement:** `content.js` watches `<head>` for any favicon link re-added by the page and immediately overrides it.
- **Background reapplication:** `background.js` listens on `tabs.onUpdated` and `tabs.onActivated` to reapply rules after navigation or tab switches.
- **Fallback injection:** If `content.js` is not available (page was open before extension loaded), `background.js` falls back to `chrome.scripting.executeScript` with the same safe, narrow observer.

### Version History

| Version   | Date     | Changes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2.0.0** | May 2026 | **Stability release.** Fixed RAM crash caused by a broad `MutationObserver` (subtree + characterData on the whole document). Removed `chrome.storage.local` title cache that created persistent ghost entries surviving reset. Fixed stale `originalTitle` on reset. Fixed wrong error message on image load failure. Removed dead code (`getUrlKey`, `currentUrlLabel` translation key, `async` on reset handler). Corrected `background.js` executeScript fallback to use safe narrow observer. |
| **1.1.0** | Jan 2026 | Custom URL fields for Exact/Prefix inputs, Regex match type with validation, stronger title persistence on SPAs, `content.js` mirrors full matching logic from `background.js`.                                                                                                                                                                                                                                                                                                                   |
| **1.0.1** | Dec 2025 | phpMyAdmin DB/table auto-detection (Dev Mode: DB).                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **1.0.0** | Nov 2025 | Initial release — exact URL renaming, bilingual UI, persistent storage.                                                                                                                                                                                                                                                                                                                                                                                                                           |

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'feat: describe your change'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 🔒 Privacy

- **No data collection** — no analytics, no telemetry, no external requests
- **No external servers** — all data lives in your Chrome profile via `chrome.storage.sync`
- **Open source** — every line is auditable

Full privacy policy: [PRIVACY.md](PRIVACY.md)

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

## 📧 Support

- **Bug reports / feature requests:** [GitHub Issues](https://github.com/MaximeCode/Tab_Renamer/issues)
- **Email:** contact.mbaude@gmail.com
- **Chrome Web Store:** [Leave a review](https://chromewebstore.google.com/detail/advanced-tab-renamer-cust/lldbgogjfhiolnngankgodpjhbdijgoe?hl=fr)

---

Made with ❤️ by [Maxime BAUDE](https://github.com/MaximeCode) — if the extension saves you time, consider ⭐ starring the repo!
