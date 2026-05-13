# 🏷️ Advanced Tab Renamer — Custom Names, Icons & Database Detection

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-blue)](https://chromewebstore.google.com/detail/advanced-tab-renamer-cust/lldbgogjfhiolnngankgodpjhbdijgoe?hl=fr)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/MaximeCode/Tab_Renamer?style=social)](https://github.com/MaximeCode/Tab_Renamer)
[![Version](https://img.shields.io/badge/version-1.2.0-green)](https://github.com/MaximeCode/Tab_Renamer)

> Advanced tab renaming with URL patterns, database detection, and **custom extension icon per tab**. Persistent storage. Bilingual (EN/FR). For developers & power users.

---

## ✨ Current Features (v1.1.0)

### 🎯 Smart URL Matching

- **Exact URL**: Target a single specific page — prefilled with the current tab URL but fully editable
- **URL Starts With**: Every tab whose URL starts with your prefix — same editable field
- **Regex**: Dedicated pattern field with JavaScript `RegExp` syntax; invalid patterns are blocked before saving
- **Match priority**: Exact URL → Regex → Dev DB mode → Prefix — explicit rules always win over broader ones

### 🗄️ Developer Mode: phpMyAdmin Integration

- Auto-detects database and table names from URL query parameters (`db=`, `table=`, etc.)
- Renames tabs as `DB: database_name | Table: table_name`
- No manual input required for day-to-day database work

### 🎨 Custom Favicon (tab icon)

- Upload any image (PNG, JPG, GIF, WebP…) from the popup
- Image is automatically resized to 32×32 and stored as a base64 PNG
- Favicon persists across page reloads and navigation via a `MutationObserver` in `content.js`
- Works alongside tab renaming — you can change name only, icon only, or both
- Fully reversible with the **Reset** button

### 🌍 Bilingual Interface

- Full English & French localization with instant language toggle (FR / EN)
- Language preference saved in `chrome.storage.sync`

### 💾 Persistent Storage

| Store | What is saved |
|---|---|
| `chrome.storage.sync` | Rename rules (exact, prefix, regex, DB mode) + favicon data URLs — synced across Chrome profiles |
| `chrome.storage.local` | Fast per-page title cache used by `content.js` |

### 🔄 Title & Favicon Persistence on Dynamic Sites

GitHub, phpMyAdmin, and SPAs regularly overwrite `document.title` and favicon links after initial load. The extension counters this by:

- A `MutationObserver` on the `<title>` element and `<head>` in `content.js`
- Periodic re-enforcement for the title (every 1 s)
- The background service worker (`background.js`) re-applies rules on `tabs.onUpdated` (status `"complete"`) and `tabs.onActivated`

---

## 🚀 Roadmap — Version 1.2.0: Custom Extension Icon per Tab

> This is the next planned feature. The full implementation plan is documented below.

### 🎯 Goal

Allow each rename rule to display a **custom icon in the Chrome toolbar** (the extension button in the top-right corner of the browser), in addition to the existing tab favicon customisation.

This is a completely different surface from the favicon:

| Surface | API | Scope |
|---|---|---|
| Tab favicon (in the tab strip) | DOM manipulation in `content.js` | Per page, survives navigation via MutationObserver |
| Extension toolbar icon | `chrome.action.setIcon()` | Per tab ID, reset by Chrome on navigation — must be reapplied |

---

### 🧠 Technical Background

#### `chrome.action.setIcon()` — the core API

The Manifest V3 API `chrome.action.setIcon(details)` accepts:

```js
chrome.action.setIcon({
  tabId: 42,          // optional — omit to set for all tabs
  imageData: <ImageData>  // OR path: "relative/path.png"
});
```

Key facts:
- **`imageData`** accepts a raw `ImageData` object (from `<canvas>` or `OffscreenCanvas`) or a size-keyed dictionary `{ 16: ImageData, 32: ImageData }`.
- **`path`** accepts a relative path to a PNG bundled with the extension — not a `data:` URL and not an external URL.
- **Per-tab icon**: setting `tabId` scopes the icon to that single tab. Chrome automatically resets the tab icon to the global default when the tab navigates or is reloaded, so **the icon must be reapplied on every navigation** (handled in `background.js` via `tabs.onUpdated`).
- **Service worker constraint**: `background.js` is a service worker — it has no DOM. It cannot use `new Image()` or `document.createElement("canvas")`. It must use `OffscreenCanvas` to decode a base64 data URL into `ImageData`.

#### Converting a stored `data:` URL to `ImageData` in a service worker

```js
async function dataUrlToImageData(dataUrl, size = 16) {
  const resp = await fetch(dataUrl);          // data: URLs are fetchable in SW
  const blob = await resp.blob();
  const bitmap = await createImageBitmap(blob, {
    resizeWidth: size,
    resizeHeight: size,
    resizeQuality: 'high'
  });
  const canvas = new OffscreenCanvas(size, size);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, size, size);
  return canvas.getContext('2d').getImageData(0, 0, size, size);
}
```

`createImageBitmap` is available in service workers and supports `resizeWidth`/`resizeHeight` options in modern Chrome — no separate resize step needed.

---

### 📐 Architecture Plan

The feature touches **four files**. No new files need to be created.

```
manifest.json     → version bump only (1.1.0 → 1.2.0)
popup.html        → already has favicon UI — no changes needed
popup.js          → already saves icon to storage — no changes needed
background.js     → ADD: applyToolbarIcon(), reapply on onUpdated + onActivated
```

The storage schema does **not** change. The `icon` field already stored in each rule entry (as a base64 `data:` URL) is reused for both the tab favicon AND the toolbar icon.

---

### 🗺️ Step-by-Step Implementation Plan

#### Step 1 — Add `applyToolbarIcon()` to `background.js`

Add a new helper function that converts the stored data URL into `ImageData` using `OffscreenCanvas` and calls `chrome.action.setIcon()` with the tab ID.

```js
// background.js

async function applyToolbarIcon(tabId, dataUrl) {
  try {
    // Decode the stored base64 PNG into a bitmap (resize to 16 and 32 px)
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();

    const [bmp16, bmp32] = await Promise.all([
      createImageBitmap(blob, { resizeWidth: 16, resizeHeight: 16, resizeQuality: 'high' }),
      createImageBitmap(blob, { resizeWidth: 32, resizeHeight: 32, resizeQuality: 'high' }),
    ]);

    const ctx16 = new OffscreenCanvas(16, 16).getContext('2d');
    ctx16.drawImage(bmp16, 0, 0);
    const imgData16 = ctx16.getImageData(0, 0, 16, 16);

    const ctx32 = new OffscreenCanvas(32, 32).getContext('2d');
    ctx32.drawImage(bmp32, 0, 0);
    const imgData32 = ctx32.getImageData(0, 0, 32, 32);

    await chrome.action.setIcon({
      tabId,
      imageData: { 16: imgData16, 32: imgData32 },
    });
  } catch (e) {
    // Tab may have been closed, page may be restricted — fail silently
  }
}
```

**Why both 16 and 32?** Chrome picks the best size based on screen DPI (HiDPI/Retina screens use the 32 px version). Providing both avoids blurry upscaling.

---

#### Step 2 — Reset to default icon when a rule has no icon

When a tab navigates to a URL that has a saved rule without a custom icon (or no rule at all), the toolbar icon should reset to the extension's default. Add a helper:

```js
function resetToolbarIcon(tabId) {
  chrome.action.setIcon({
    tabId,
    // Passing null imageData / empty path resets to the manifest default
    path: {
      16: 'icon16.png',
      48: 'icon48.png',
      128: 'icon128.png',
    },
  }).catch(() => {});
}
```

---

#### Step 3 — Hook into the existing `tabs.onUpdated` listener

The existing listener already handles title and tab favicon. Extend it to also handle the toolbar icon:

```js
// background.js — EXISTING listener (to be extended)

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.sync.get(null, (result) => {
      const entry = findMatchingEntry(tab.url, result);
      if (!entry) {
        resetToolbarIcon(tabId);   // ← ADD: reset when no rule matches
        return;
      }
      if (entry.name) applyAndPersistTitle(tabId, entry.name);
      if (entry.icon) {
        applyAndPersistFavicon(tabId, entry.icon);
        applyToolbarIcon(tabId, entry.icon);   // ← ADD
      } else {
        resetToolbarIcon(tabId);               // ← ADD: rule exists but no icon
      }
    });
  }
});
```

---

#### Step 4 — Hook into the existing `tabs.onActivated` listener

Same logic when the user switches to a tab:

```js
// background.js — EXISTING listener (to be extended)

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (!tab.url) return;

  chrome.storage.sync.get(null, (result) => {
    const entry = findMatchingEntry(tab.url, result);
    if (!entry) {
      resetToolbarIcon(tab.id);    // ← ADD
      return;
    }
    if (entry.name) applyAndPersistTitle(tab.id, entry.name);
    if (entry.icon) {
      applyAndPersistFavicon(tab.id, entry.icon);
      applyToolbarIcon(tab.id, entry.icon);   // ← ADD
    } else {
      resetToolbarIcon(tab.id);               // ← ADD
    }
  });
});
```

---

#### Step 5 — Apply toolbar icon immediately when the user clicks "Apply" in the popup

Currently the popup sends a message to `content.js` for the favicon, but the toolbar icon must be set from the service worker (it has no DOM constraint there, but the popup can also call `chrome.action.setIcon` directly since it runs in an extension page context, not a SW).

The cleanest approach is to have the popup send a message to `background.js` right after saving:

```js
// popup.js — inside the renameBtn click handler, after chrome.storage.sync.set(...)

chrome.runtime.sendMessage({
  action: 'applyToolbarIcon',
  tabId: tab.id,
  dataUrl: currentFaviconDataUrl || null,
});
```

And in `background.js`, add a message listener:

```js
// background.js — NEW listener

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyToolbarIcon') {
    if (message.dataUrl) {
      applyToolbarIcon(message.tabId, message.dataUrl);
    } else {
      resetToolbarIcon(message.tabId);
    }
  }
});
```

This way the toolbar icon updates instantly when the user clicks "Apply", without waiting for a reload.

---

#### Step 6 — Reset toolbar icon when the user clicks "Reset"

In `popup.js`, inside the `resetBtn` click handler, after calling `chrome.storage.sync.remove(...)`:

```js
// popup.js — inside the resetBtn handler

chrome.runtime.sendMessage({
  action: 'applyToolbarIcon',
  tabId: tab.id,
  dataUrl: null,   // null triggers resetToolbarIcon in background.js
});
```

---

#### Step 7 — Bump version and update manifest

```json
// manifest.json
{
  "version": "1.2.0"
}
```

No new permissions are required. `chrome.action.setIcon()` is already covered by the existing `"activeTab"` + `"tabs"` permissions in Manifest V3.

---

### ⚠️ Known Constraints & Edge Cases

| Constraint | Details |
|---|---|
| **`path` does not accept `data:` URLs in `setIcon`** | You must use `imageData` (an actual `ImageData` object) when the icon is a stored base64 string. The `path` property only accepts relative paths to bundled files. |
| **Service worker has no DOM** | `new Image()` and `document.createElement('canvas')` are unavailable. Use `OffscreenCanvas` + `createImageBitmap` instead. |
| **Icon resets on navigation** | Chrome automatically resets a per-tab icon when the tab navigates. The `tabs.onUpdated` listener (Step 3) handles reapplication. |
| **Restricted pages** | `chrome://`, `chrome-extension://`, and Web Store pages block `setIcon` with a tab ID. Wrap all calls in try/catch and fail silently. |
| **Storage size** | `chrome.storage.sync` has a 8 KB per-item quota and a 100 KB total quota. A 32×32 PNG stored as base64 is typically 2–4 KB, well within limits. If users store many rules with icons, consider warning them or using `chrome.storage.local` for icon data only. |
| **`createImageBitmap` resize options** | The `resizeWidth`/`resizeHeight` options in `createImageBitmap` are supported in Chrome 67+. Since the extension already requires MV3 (Chrome 88+), this is safe. |

---

### 🗂️ Files Modified in v1.2.0

| File | Change |
|---|---|
| `background.js` | Add `applyToolbarIcon()`, `resetToolbarIcon()`, extend `onUpdated`, extend `onActivated`, add `onMessage` listener for `applyToolbarIcon` action |
| `popup.js` | Send `applyToolbarIcon` message after Apply and after Reset |
| `manifest.json` | Version `1.1.0` → `1.2.0` |
| `popup.html` | No change needed — favicon UI already exists |
| `content.js` | No change needed — tab favicon logic already exists |

---

## 🚀 Installation

### From Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store page](https://chromewebstore.google.com/detail/advanced-tab-renamer-cust/lldbgogjfhiolnngankgodpjhbdijgoe?hl=fr)
2. Click "Add to Chrome"
3. Confirm installation — you're ready to go!

### Manual Installation (Developer Mode)

1. Clone or download this repository
2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right)
4. Click **Load unpacked** and select the `Tab_Renamer` folder
5. The extension is installed instantly

---

## 📖 Usage

### Basic Tab Renaming

1. Click the **Advanced Tab Renamer** icon in your toolbar
2. Enter a custom title in the input field
3. Choose a match type and adjust the URL field if needed:
   - **Exact URL** — only this specific URL
   - **URL Starts With** — all URLs starting with this prefix
   - **Regex** — full JavaScript regular expression
4. Optionally upload a **custom favicon** (any image → resized to 32×32 PNG)
5. Click **Apply** — title and favicon update immediately and persist across reloads

### Resetting

Click **Reset** to remove the rule for the current tab. The original title and favicon are restored immediately.

### Developer Mode: phpMyAdmin

Check **Mode Dev : DB** — the extension auto-detects `db=` and `table=` from the URL and proposes a formatted name. No manual input needed.

### Language Switching

Click **FR** or **EN** at the top right of the popup. Your preference is saved automatically.

---

## 📋 URL Matching Examples

| Type | Pattern | Name | Matches |
|---|---|---|---|
| Exact URL | Current tab URL | "Admin Panel" | Only this exact page |
| URL Starts With | `http://localhost:3000` | "Dev Server" | All URLs under this prefix |
| Regex | `localhost:\d+` | "Local Dev" | `localhost:3000`, `:8080`, `:5173`… |
| Regex | `github\.com/.*/issues` | "GitHub Issues" | All GitHub issue pages |
| Regex | `phpmyadmin.*[?&]db=prod` | "DB: prod" | phpMyAdmin prod database pages |
| Regex | `.*\.(jpg\|png\|gif)$` | "Image" | All image file URLs |

---

## 🛠️ Development

Built with **vanilla JavaScript** — no bundler, no framework, no build step.

### File Structure

```text
Tab_Renamer/
├── manifest.json       # Extension configuration (Manifest V3)
├── background.js       # Service worker — rule matching, title + icon persistence
├── content.js          # Content script — DOM title/favicon enforcement per page
├── popup.html          # Popup UI markup
├── popup.js            # Popup UI logic — user input, storage, messaging
├── template.html       # Chrome Web Store screenshot template
├── icon16.png          # Extension icon 16×16
├── icon48.png          # Extension icon 48×48
├── icon128.png         # Extension icon 128×128
├── LICENSE             # MIT License
├── PRIVACY.md          # Privacy Policy
└── README.md           # This file
```

### Technologies

- **Manifest V3** — latest Chrome extension architecture
- **chrome.storage.sync** — cross-profile persistent rule storage
- **chrome.storage.local** — fast per-page title cache
- **chrome.action API** — toolbar icon control (v1.2.0)
- **OffscreenCanvas / createImageBitmap** — image processing in the service worker (v1.2.0)
- **MutationObserver** — title and favicon persistence on dynamic pages
- **Vanilla JS** — zero dependencies

### Version History

| Version | Changes |
|---|---|
| **1.2.0** *(planned)* | Custom extension toolbar icon per tab — `applyToolbarIcon()` in background.js, reapplied on navigation via `tabs.onUpdated` and `tabs.onActivated` |
| **1.1.0** | Custom URL fields for Exact/Prefix inputs, Regex match type, stronger title persistence (MutationObserver + background worker), content.js mirrors full matching logic |
| **1.0.1** | phpMyAdmin DB/table auto-detection (Dev Mode: DB) |
| **1.0.0** | Initial release — exact URL renaming, bilingual UI, persistent storage |

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 🔒 Privacy

- **No data collection** — no analytics, no telemetry, no external requests
- **No external servers** — all data stays on your device / Chrome sync
- **Open source** — every line of code is auditable

Full privacy policy: [PRIVACY.md](PRIVACY.md)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/MaximeCode/Tab_Renamer/issues)
- **Email**: contact.mbaude@gmail.com
- **Chrome Web Store**: [Leave a review](https://chromewebstore.google.com/detail/advanced-tab-renamer-cust/lldbgogjfhiolnngankgodpjhbdijgoe?hl=fr)

---

Made with ❤️ by [Maxime BAUDE](https://github.com/MaximeCode)

If this extension helps you stay organised, consider ⭐ starring the repo!
