Bhramnath Digital Class — Send Notice / WhatsApp Guide

Overview

This project is a lightweight, static school management UI (HTML/CSS/JavaScript) that stores data in localStorage. It includes modules for students, teachers, classes, fees, exams and a Notices/Communication module.

This README focuses on the Send Notice feature and how to include parent contact numbers from an Excel/CSV file and send via WhatsApp Web.

Files of interest

- `index.html` — Main single-page app with modals and modules (Students, Classes, Notices, etc.).
- `script.js` — App logic. The Send Notice / WhatsApp helpers live here:
  - `sendViaWhatsApp(noticeData)`
  - `collectWhatsAppNumbersFromForm()`
  - `handleContactsFileUpload()` / `parseCSVFile()` / `parseExcelFile()`
- `styles.css` — Main CSS.
- `teacher.html`, `class.html`, `student.html` — standalone profile pages.

How Send Notice → WhatsApp works

1. Open `index.html` in a modern desktop browser (Chrome or Edge recommended).
2. Dashboard → Quick Actions → Send Notice (or open the Notices module) → "Send Notice" modal.
3. Fill in Title, Date and Content.
4. Recipients: choose All / Teachers / Specific Class etc. These options are used to collect phone numbers from the in-app students/teachers data (fields used: `guardianPhone`, `phone`, `guardianEmail`, `email`).
5. Optional: Upload a contacts file exported from Excel.
   - Prefer CSV (recommended). Supported file types: `.csv`, `.xlsx`, `.xls`.
   - CSV parsing: the script attempts to detect header names like `phone`, `mobile`, `contact`, `guardian` and will extract those columns.
   - If no headers are found, it heuristically extracts any numeric-looking column values of length >= 8.
6. Send Method: check WhatsApp (checkbox). When you click Send, the app:
   - Builds a prefilled message from the notice title/date/content.
   - Collects phone numbers from the form selections and any uploaded contacts.
   - Cleans numbers (removes spaces, dashes and parentheses).
   - Opens up to N individual chat windows (api.whatsapp.com/send?phone=...&text=...) in new tabs. N is 8 by default.
   - If no numbers are available, it opens `web.whatsapp.com` with the message prefilled so you can manually choose recipients.

CSV example (recommended)

Create/export a CSV with one of these header names for the phone column (case-insensitive):

phone,mobile,contact,guardianPhone
9876543210
+919876543210

If your CSV has other columns (Name, Roll etc.) the parser will still try to find numeric columns.

Limitations and important notes

- Browser automation: The app cannot automatically press "Send" inside WhatsApp. You must confirm/send each message from the WhatsApp UI.
- Country codes: For direct one-to-one links (`api.whatsapp.com/send?phone=...`) use international format (country code) e.g. `919876543210` (India without the +). If numbers lack country codes the links may not open the intended chat.
- Excel (`.xlsx`, `.xls`) parsing is limited in this static app. A lightweight heuristic is used; for reliable results export to CSV first.
- Popup blockers: Opening many tabs may trigger browser popup blockers. The app opens up to 8 tabs by default to reduce that risk.
- Large lists: For large recipient lists consider:
  - Exporting cleaned numbers (the app can parse and show count) and using WhatsApp Business tools.
  - Choosing the "WhatsApp Web fallback" where a single web.whatsapp.com tab opens with the prefilled message and you paste recipients manually.

Customization

- Change the tab-open cap (default 8):
  - Edit `script.js` and find `const cap = 8;` inside `sendViaWhatsApp()` and change the value to your preferred number.
- Default country code: the app does not auto-prepend a country code. To add one automatically, you can modify `cleanPhone()` in `script.js` to prepend a configured prefix when numbers appear local.
- Better Excel support: include SheetJS (`xlsx`) library and replace the fallback `parseExcelFile()` function with a proper XLSX parser. This requires adding the library (CDN or local script) to `index.html` and adjusting parsing logic.

Troubleshooting

- No tabs open when sending: your browser blocked popups. Allow popups for the site or use the WhatsApp Web fallback.
- Numbers not recognized: check that the CSV phone column contains digits and, ideally, the country code.
- Too many recipients: tools like WhatsApp Business or bulk messaging services are recommended for lists > 100.

Privacy & Responsibility

- Make sure you have consent to message the provided phone numbers and comply with local messaging/telecom regulations.
- The app stores data in localStorage on the machine — it's not uploaded to a server by default.

Next steps I can implement for you

- Add a UI option in the Send Notice modal to choose the send behavior (Open tabs N / Copy numbers to clipboard + open WhatsApp Web / Single WhatsApp Web tab only).
- Add an automatic country code setting and UI input.
- Integrate SheetJS (`xlsx`) for robust Excel parsing (will add a vendor script).
- Add an export button that downloads parsed/cleaned numbers as CSV.

If you want any of the above, tell me which and I will implement it and update this README accordingly.

License

MIT — free to use and modify for internal use.

