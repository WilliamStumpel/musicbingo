# Device Compatibility Checklist

Device-specific testing checklist for validating Music Bingo on target hardware.

## Supported Devices

### Host App (Laptop)

| Platform | Status | Notes |
|----------|--------|-------|
| macOS (Chrome) | Tested | Primary development platform |
| macOS (Safari) | Tested | Works, some CSS differences |
| macOS (Firefox) | Untested | Should work |
| Windows (Chrome) | Untested | Expected to work |
| Windows (Edge) | Untested | Expected to work |
| Linux (Chrome) | Untested | Expected to work |

### Scanner PWA (Mobile)

| Platform | Status | Notes |
|----------|--------|-------|
| iOS Safari | Tested | Use 100dvh for viewport |
| iOS Chrome | Untested | May have camera restrictions |
| Android Chrome | Tested | May need permission in Settings |
| Android Firefox | Untested | QR scanner library may have issues |

### Player View (External Display)

| Method | Status | Notes |
|--------|--------|-------|
| HDMI from laptop | Tested | Primary method |
| AirPlay | Untested | May work with extended desktop |
| Chromecast | Untested | Requires Chrome tab casting |

---

## Browser Requirements

The following Web APIs are required for full functionality:

### Scanner PWA
- **Camera API** (`getUserMedia`) - Required for QR scanning
- **localStorage** - Settings and server URL persistence
- **Fetch API** - All API calls to backend
- **CSS Grid/Flexbox** - Layout rendering
- **Service Worker** - Offline support (optional)

### Host App
- **localStorage** - Cross-window sync, game state
- **Fetch API** - All API calls to backend
- **CSS Grid/Flexbox** - Layout rendering
- **window.open** - Opening Player View

### Player View
- **localStorage events** - Cross-window sync with Host
- **CSS Grid/Flexbox** - Call Board layout
- **CSS Animations** - Timer, confetti, transitions

---

## Device Checklist Template

Use this template to validate a specific device configuration.

```
================================================================
DEVICE TESTING RECORD
================================================================

Device: _______________________
OS Version: _______________________
Browser: _______________________
Browser Version: _______________________
Date Tested: _______________________
Tested By: _______________________

----------------------------------------------------------------
SCANNER APP
----------------------------------------------------------------

Initial Load:
[ ] Page loads without errors
[ ] UI renders correctly
[ ] No console errors

Camera Access:
[ ] Camera permission prompt appears
[ ] Camera feed visible after granting
[ ] Camera works in low light
[ ] Focus adjusts properly

QR Scanning:
[ ] QR codes scan successfully
[ ] Scan speed acceptable (<1 sec)
[ ] Works with various print qualities
[ ] Works at different distances

Results Display:
[ ] Winner (green) displays correctly
[ ] Non-winner (red) displays correctly
[ ] Animations render smoothly
[ ] Text is readable

Tab Navigation:
[ ] All tabs accessible
[ ] Tab switching is responsive
[ ] State persists across tabs

Song Checklist:
[ ] Songs load and display
[ ] Scrolling is smooth
[ ] Played songs highlighted
[ ] Real-time sync works (2 sec)

Registration:
[ ] Modal opens correctly
[ ] Keyboard appears for input
[ ] Save works correctly
[ ] Validation works

----------------------------------------------------------------
HOST APP
----------------------------------------------------------------

Initial Load:
[ ] Page loads without errors
[ ] All components render
[ ] No console errors

Game Management:
[ ] Game selector dropdown works
[ ] Songs load correctly
[ ] Song list scrollable

Song Interactions:
[ ] Click/tap marks songs
[ ] Visual feedback immediate
[ ] Call Board updates
[ ] Now Playing indicator works

Pattern Selection:
[ ] Pattern dropdown works
[ ] Pattern preview displays
[ ] Changes apply correctly

Prize Configuration:
[ ] Prize input editable
[ ] Prize saves correctly
[ ] Prize displays in header

Player View Launch:
[ ] Button opens new window
[ ] Window is draggable
[ ] Content syncs correctly

----------------------------------------------------------------
PLAYER VIEW
----------------------------------------------------------------

Display:
[ ] Full screen fills correctly
[ ] No scrollbars visible
[ ] Layout adapts to resolution

Call Board:
[ ] Songs display in grid
[ ] Correct column count
[ ] Song tiles readable
[ ] Max 20 songs enforced

Timer & Reveal:
[ ] Timer countdown visible
[ ] Delayed reveal works
[ ] Amber flash animation

Pattern Display:
[ ] Pattern grid visible
[ ] Correct cells highlighted
[ ] Change animation works

Winner Announcement:
[ ] Overlay appears
[ ] Confetti animates
[ ] Text readable
[ ] Auto-dismiss works
[ ] Tap dismiss works

----------------------------------------------------------------
NOTES / ISSUES FOUND
----------------------------------------------------------------





----------------------------------------------------------------
VERDICT: [ ] PASS  [ ] FAIL  [ ] PARTIAL
----------------------------------------------------------------
```

---

## Known Issues by Device

### iOS Safari

| Issue | Workaround | Status |
|-------|------------|--------|
| 100vh doesn't account for Safari toolbar | Use `100dvh` (dynamic viewport height) | Resolved |
| Camera access requires HTTPS | Use ngrok tunnel | Required |
| PWA "Add to Home" sometimes fails | Clear Safari cache, retry | Intermittent |

### Android Chrome

| Issue | Workaround | Status |
|-------|------------|--------|
| Camera permission may not prompt | Enable in Settings > Site Settings > Camera | Known |
| Keyboard covers input fields | Scroll to keep input visible | Known |
| Background tabs throttled | Keep Scanner in foreground | Expected |

### Firefox (Desktop/Mobile)

| Issue | Workaround | Status |
|-------|------------|--------|
| qr-scanner library compatibility | Use Chrome if scanning fails | Known |
| CSS Grid gap rendering | Minor visual differences | Cosmetic |

### Safari (Desktop)

| Issue | Workaround | Status |
|-------|------------|--------|
| Third-party localStorage blocked | Ensure same domain or first-party | Known |
| PWA features limited | Use Chrome for full PWA | Expected |

### Edge (Windows)

| Issue | Workaround | Status |
|-------|------------|--------|
| No known issues | - | - |

---

## Testing Sign-Off

Track which device configurations have been validated.

### Scanner PWA Devices

| Device | OS | Browser | Tester | Date | Status |
|--------|----|---------|---------|----|--------|
| iPhone 12 | iOS 16 | Safari | | | |
| iPhone 14 | iOS 17 | Safari | | | |
| iPad Pro | iPadOS 17 | Safari | | | |
| Samsung Galaxy S22 | Android 13 | Chrome | | | |
| Google Pixel 7 | Android 14 | Chrome | | | |

### Host App Devices

| Device | OS | Browser | Tester | Date | Status |
|--------|----|---------|---------|----|--------|
| MacBook Pro M1 | macOS 14 | Chrome | | | |
| MacBook Pro M1 | macOS 14 | Safari | | | |
| Windows Laptop | Win 11 | Chrome | | | |
| Windows Laptop | Win 11 | Edge | | | |

### Player View Configurations

| Method | Display | Resolution | Tester | Date | Status |
|--------|---------|------------|--------|------|--------|
| HDMI | 1080p TV | 1920x1080 | | | |
| HDMI | 4K TV | 3840x2160 | | | |
| HDMI | Bar monitor | 1366x768 | | | |

---

## Minimum Requirements

### Scanner Device
- iOS 14+ or Android 10+
- Camera with autofocus
- 2GB RAM minimum
- Stable WiFi connection

### Host Device
- Any modern laptop (2018+)
- 4GB RAM minimum
- Chrome, Safari, Firefox, or Edge
- Node.js 16+ for development

### External Display
- Any monitor/TV with HDMI input
- 720p minimum resolution
- 1080p recommended

---

*Last updated: 2026-01-31*
