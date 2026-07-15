# Terrnix Certificate of Achievement Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0

---

## Certificate Types

| Score Range | Type | Label | Description |
|-------------|------|-------|-------------|
| 0–49 | Completion | Certificate of Completion | Recognises participation and completion |
| 50–69 | Achievement | Foundation Achievement | Basic competence established |
| 70–84 | Achievement | Practitioner Achievement | Solid operational maturity |
| 85–100 | Achievement | Advanced Achievement | Leading practice demonstrated |

**Rule:** Use "Certificate of Achievement" only when score ≥ 50. Below 50, use "Certificate of Completion".

---

## Certificate Layout

### Format
- **Orientation:** Landscape (A4: 297mm × 210mm)
- **Margins:** 20mm all sides
- **Background:** White (#FFFFFF) with subtle border

### Elements (Top to Bottom)

#### 1. Header Row
- **Left:** Terrnix logo (high-resolution PNG, max height 15mm)
- **Right:** Certificate type label (e.g., "Certificate of Achievement")
  - Font: Bold, 14pt, uppercase
  - Color: Terrnix emerald (#059669)

#### 2. Title
- **Text:** "Certificate of Achievement" or "Certificate of Completion"
- **Font:** Georgia or serif, 28pt, bold
- **Color:** Dark charcoal (#1a1a1a)
- **Alignment:** Center
- **Spacing:** 10mm below header

#### 3. Subtitle
- **Text:** "This certificate confirms that"
- **Font:** Georgia, 14pt, regular
- **Color:** Medium gray (#666666)
- **Alignment:** Center

#### 4. Participant Name
- **Text:** `[Full Name]`
- **Font:** Georgia, 24pt, bold
- **Color:** Terrnix emerald (#059669)
- **Alignment:** Center
- **Spacing:** 8mm above and below

#### 5. Assessment Details
- **Text:** 
  ```
  completed the [Assessment Name]
  on [Date] and achieved a score of [Score]/100
  ```
- **Font:** Georgia, 12pt, regular
- **Color:** Dark charcoal (#1a1a1a)
- **Alignment:** Center

#### 6. Maturity Level Badge
- **Text:** `[Maturity Level]` (e.g., "Practitioner Achievement")
- **Shape:** Rounded rectangle with border
- **Background:** Terrnix emerald at 10% opacity
- **Border:** 1pt solid Terrnix emerald
- **Font:** 11pt, bold, uppercase
- **Color:** Terrnix emerald (#059669)
- **Alignment:** Center

#### 7. Score Circle
- **Shape:** Circle, 30mm diameter
- **Border:** 2pt solid Terrnix emerald
- **Interior:** White
- **Text:** `[Score]%`
- **Font:** 18pt, bold
- **Color:** Terrnix emerald
- **Alignment:** Center

#### 8. Verification Section
- **Text:** 
  ```
  Certificate ID: [TRX-XXX-YYYYMMDD-XXXXXX]
  Verify at: terrnix.com/certificate/verify/?id=[ID]
  ```
- **QR Code:** 25mm × 25mm, linked to verification URL
- **Font:** 9pt, monospace for ID
- **Color:** Medium gray
- **Alignment:** Center

#### 9. Footer Row
- **Left:** 
  - Date: `[Date]`
  - Font: 10pt, regular
- **Center:**
  - Terrnix website: `terrnix.com`
  - Font: 10pt, regular
- **Right:**
  - Signature area (image or line)
  - Label: "Authorised Terrnix Representative"
  - Font: 9pt, italic

#### 10. Disclaimer
- **Text:** 
  ```
  This certificate recognises completion and performance in a Terrnix educational 
  assessment. It is not a professional licence, regulatory qualification or 
  third-party accreditation.
  ```
- **Font:** 8pt, regular, italic
- **Color:** Medium gray (#999999)
- **Alignment:** Center
- **Position:** Bottom of page, 5mm from bottom edge

---

## Typography

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Title | Georgia | 28pt | Bold | #1a1a1a |
| Participant Name | Georgia | 24pt | Bold | #059669 |
| Body Text | Georgia | 12pt | Regular | #1a1a1a |
| Subtitle | Georgia | 14pt | Regular | #666666 |
| Badge | Sans-serif | 11pt | Bold | #059669 |
| Score | Sans-serif | 18pt | Bold | #059669 |
| Certificate ID | Monospace | 9pt | Regular | #666666 |
| Footer | Sans-serif | 10pt | Regular | #666666 |
| Disclaimer | Sans-serif | 8pt | Italic | #999999 |

---

## Colors

| Purpose | Hex | Usage |
|---------|-----|-------|
| Terrnix Emerald | #059669 | Primary accent, name, score, badges |
| Dark Charcoal | #1a1a1a | Body text, title |
| Medium Gray | #666666 | Subtitles, footer, IDs |
| Light Gray | #999999 | Disclaimer |
| White | #FFFFFF | Background |
| Emerald Tint | #ecfdf5 | Badge background |

---

## Certificate ID Format

```
TRX-{3-letter-assessment-code}-{YYYYMMDD}-{6-char-random}

Examples:
TRX-CAR-20260715-A7F42K   (Carbon Accounting Readiness)
TRX-ESG-20260715-B3M91P   (ESG Maturity)
TRX-CSR-20260715-D8K27Q   (CSRD Readiness)
TRX-CBA-20260715-F5N63W   (CBAM Readiness)
TRX-SUS-20260715-H2J49R   (Sustainability Leadership)
```

**Assessment Codes:**
| Assessment | Code |
|------------|------|
| Carbon Accounting Readiness | CAR |
| ESG Maturity | ESG |
| CSRD Readiness | CSR |
| CBAM Readiness | CBA |
| Sustainability Leadership | SUS |

**Random Component:**
- 6 characters: uppercase letters A-Z + digits 0-9
- Total combinations: 62^6 = 56,800,235,584
- Generated using crypto.getRandomValues()

---

## File Naming

```
terrnix-certificate-{assessment-id}-{participant-name}-{date}.pdf

Example:
terrnix-certificate-carbon-readiness-tallal-belkheiri-2026-07-15.pdf
```

**Sanitisation:**
- Participant name: lowercase, spaces replaced with hyphens, remove special characters
- Date: ISO format YYYY-MM-DD

---

## PDF Generation Requirements

### jsPDF Configuration
```javascript
const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4',
  compress: true
});
```

### Quality Settings
- Image quality: 150 DPI minimum for logo
- Text rendering: vector (not rasterised)
- Font embedding: subset of standard fonts
- File size target: < 200KB per certificate

### Generation Steps
1. Create jsPDF instance (landscape A4)
2. Add Terrnix logo image (top-left)
3. Add certificate type label (top-right)
4. Add title, subtitle, participant name
5. Add assessment details text
6. Draw maturity level badge (rounded rect + text)
7. Draw score circle (circle + text)
8. Add certificate ID and verification URL
9. Generate QR code canvas, add as image
10. Add footer (date, website, signature)
11. Add disclaimer text
12. Save PDF with formatted filename

### No Print Dialog
- Use `doc.save(filename)` directly
- Do NOT call `window.print()`
- Do NOT use html2pdf (opens print dialog)

---

## Verification Page

### URL
```
https://terrnix.com/certificate/verify/?id=TRX-CAR-20260715-A7F42K
```

### Displayed Information
```
✓ Certificate Verified

Certificate ID: TRX-CAR-20260715-A7F42K
Status: Valid

Participant: Tallal B.
Assessment: Carbon Accounting Readiness Assessment
Issue Date: 15 July 2026
Score: 72/100
Maturity Level: Practitioner Achievement

This certificate was issued by Terrnix.
```

### Not Displayed
- Email address
- Company name
- Job title
- Full participant name (only first name + last initial)

### Invalid Certificate
```
✗ Certificate Not Found

The certificate ID you entered could not be verified.
Please check the ID and try again.

If you believe this is an error, contact support@terrnix.com.
```

---

## Security

| Threat | Mitigation |
|--------|------------|
| Certificate forgery | Unique IDs, verification endpoint, digital notarisation (future) |
| ID guessing | 56 billion combinations, rate limiting on verification |
| Email exposure | Only first name + last initial on verification page |
| PDF tampering | Future: digital signature or blockchain notarisation |

---

## Implementation Checklist

- [ ] jsPDF library loaded (self-hosted)
- [ ] Logo image available at `/assets/images/terrnix-logo.png`
- [ ] Signature image available at `/assets/images/signature.png`
- [ ] QR code library loaded (self-hosted)
- [ ] Certificate generation function implemented
- [ ] Filename sanitisation implemented
- [ ] Verification page created at `/certificate/verify/`
- [ ] Backend endpoint `/api/certificate/verify` implemented
- [ ] Rate limiting on verification endpoint
- [ ] Certificate ID generation uses crypto.getRandomValues()
- [ ] PDF file size < 200KB
- [ ] No browser print dialog used
- [ ] Disclaimer text included
- [ ] Mobile-friendly verification page
