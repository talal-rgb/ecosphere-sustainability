# Terrnix Certificate Engine Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** Core Infrastructure

---

## Philosophy

The Certificate Engine generates premium, verifiable certificates that participants can share professionally. Every certificate must feel like a credential from a respected institution, not a participation trophy.

**Core Principles:**
1. **Prestige:** Design worthy of LinkedIn profiles and CVs
2. **Verifiable:** Anyone can confirm authenticity online
3. **Secure:** Tamper-resistant IDs, no PII exposure
4. **Accessible:** Screen-reader friendly, high contrast
5. **Lightweight:** Sub-200KB, fast generation

---

## Certificate Types

| Score Range | Type | Label | Description |
|-------------|------|-------|-------------|
| 0–49 | Completion | Certificate of Completion | Recognises participation and effort |
| 50–69 | Achievement | Foundation Achievement | Basic competence established |
| 70–84 | Achievement | Practitioner Achievement | Solid operational maturity |
| 85–100 | Achievement | Advanced Achievement | Leading practice demonstrated |

**Rule:** Use "Certificate of Achievement" only when score ≥ 50. Below 50, use "Certificate of Completion".

---

## Certificate ID Format

```
TRX-{3-letter-code}-{YYYYMMDD}-{6-char-random}

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
| Net Zero Readiness | NZR |
| Scope 3 Readiness | SC3 |
| Energy Transition | ENR |
| ISO 14064 Readiness | ISO |
| Supply Chain Sustainability | SCS |
| Sustainability Leadership | SUS |

**Random Component:**
- 6 characters: uppercase A-Z + digits 0-9
- Total combinations: 62^6 = 56,800,235,584
- Generated using `crypto.getRandomValues()`

---

## Certificate Layout (Landscape A4)

### Dimensions
- **Orientation:** Landscape
- **Format:** A4 (297mm × 210mm)
- **Margins:** 20mm all sides
- **Safe Area:** 257mm × 170mm

### Typography

| Element | Font | Size | Weight | Colour |
|---------|------|------|--------|--------|
| Title | Georgia | 36pt | Bold | #1a1a1a |
| Participant Name | Georgia | 28pt | Bold | #059669 |
| Body | Georgia | 12pt | Regular | #1a1a1a |
| Subtitle | Georgia | 14pt | Regular | #666666 |
| Badge | Inter | 11pt | Bold | #059669 |
| Score | Inter | 18pt | Bold | #059669 |
| Certificate ID | Monospace | 9pt | Regular | #666666 |
| Footer | Inter | 10pt | Regular | #666666 |
| Disclaimer | Inter | 8pt | Italic | #999999 |

### Colour Palette

| Purpose | Hex | Usage |
|---------|-----|-------|
| Primary | #059669 | Accent, name, score, borders |
| Dark | #1a1a1a | Body text, title |
| Medium | #666666 | Subtitles, footer |
| Light | #999999 | Disclaimer |
| White | #FFFFFF | Background |
| Tint | #ecfdf5 | Badge background |

---

## Certificate Elements

### 1. Header Row

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Terrnix Logo]                                    Certificate of Achievement│
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Logo:** Top-left, max height 20mm, transparent PNG
- **Type Label:** Top-right, uppercase, emerald colour

### 2. Title

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                    Certificate of Achievement                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Font: Georgia, 36pt, bold
- Colour: #1a1a1a
- Alignment: Center
- Spacing: 15mm below header

### 3. Subtitle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                       This certificate confirms that                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Font: Georgia, 14pt, regular
- Colour: #666666
- Alignment: Center

### 4. Participant Name

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         Tallal Belkheiri                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Font: Georgia, 28pt, bold
- Colour: #059669
- Alignment: Center
- Spacing: 10mm above and below

### 5. Assessment Details

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│    completed the Carbon Accounting Readiness Assessment                     │
│    on 15 July 2026 and achieved a score of 72/100                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Font: Georgia, 12pt, regular
- Colour: #1a1a1a
- Alignment: Center

### 6. Maturity Badge

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                      ┌─────────────────────┐                                │
│                      │  Practitioner Level │                                │
│                      └─────────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Shape: Rounded rectangle, 8mm radius
- Background: #ecfdf5 (emerald tint)
- Border: 1pt solid #059669
- Text: 11pt, bold, uppercase, #059669
- Padding: 8mm horizontal, 4mm vertical

### 7. Score Circle

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              ┌──────┐                                       │
│                              │  72% │                                       │
│                              └──────┘                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Shape: Circle, 30mm diameter
- Border: 2pt solid #059669
- Interior: White
- Text: 18pt, bold, #059669
- Alignment: Center

### 8. Verification Section

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  Certificate ID: TRX-CAR-20260715-A7F42K                                   │
│  Verify at: terrnix.com/certificate/verify/?id=TRX-CAR-20260715-A7F42K     │
│                                                                             │
│  [QR Code]                                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Certificate ID: Monospace, 9pt, #666666
- Verification URL: 9pt, #666666
- QR Code: 25mm × 25mm, linked to verification URL

### 9. Footer Row

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  15 July 2026                    terrnix.com                    [Signature] │
│                                                                             │
│         Authorised Terrnix Representative                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Date: Left, 10pt, regular
- Website: Center, 10pt, regular
- Signature: Right, image or line, 9pt italic label

### 10. Disclaimer

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  This certificate recognises completion and performance in a Terrnix        │
│  educational assessment. It is not a professional licence, regulatory       │
│  qualification or third-party accreditation.                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- Font: Inter, 8pt, italic
- Colour: #999999
- Alignment: Center
- Position: 5mm from bottom edge

---

## Certificate Engine Class

```javascript
class CertificateEngine {
  constructor() {
    this.dependenciesLoaded = false;
    this.jsPDF = null;
    this.qrcode = null;
  }
  
  async loadDependencies() {
    if (this.dependenciesLoaded) return;
    
    const [jsPDF, qrcode] = await Promise.all([
      import('/assets/vendor/jspdf.umd.min.js'),
      import('/assets/vendor/qrcode.min.js')
    ]);
    
    this.jsPDF = jsPDF.jsPDF;
    this.qrcode = qrcode.default;
    this.dependenciesLoaded = true;
  }
  
  async generate(results, participant, config) {
    await this.loadDependencies();
    
    const doc = new this.jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Get certificate type
    const certType = this.getCertificateType(results.overall.score, config);
    
    // Generate certificate ID
    const certId = this.generateId(config.id);
    
    // Build certificate
    await this.addBackground(doc);
    await this.addBorders(doc);
    await this.addLogo(doc, config);
    await this.addTypeLabel(doc, certType);
    await this.addTitle(doc, certType);
    await this.addSubtitle(doc);
    await this.addParticipantName(doc, participant.name);
    await this.addAssessmentDetails(doc, results, config);
    await this.addMaturityBadge(doc, results.overall.maturityLevel);
    await this.addScoreCircle(doc, results.overall.score);
    await this.addVerification(doc, certId);
    await this.addQRCode(doc, certId);
    await this.addFooter(doc, participant, config);
    await this.addDisclaimer(doc);
    
    return {
      doc,
      id: certId,
      filename: this.generateFilename(config.slug, participant.name)
    };
  }
  
  getCertificateType(score, config) {
    const threshold = config.certificateRules.thresholds.find(
      t => score >= t.min && score <= t.max
    );
    return threshold || config.certificateRules.thresholds[0];
  }
  
  generateId(assessmentId) {
    const code = this.getAssessmentCode(assessmentId);
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = this.generateRandom(6);
    return `TRX-${code}-${date}-${random}`;
  }
  
  getAssessmentCode(assessmentId) {
    const codes = {
      'carbon-accounting-readiness': 'CAR',
      'esg-maturity': 'ESG',
      'csrd-readiness': 'CSR',
      'cbam-readiness': 'CBA',
      'net-zero-readiness': 'NZR',
      'scope-3-readiness': 'SC3',
      'energy-transition': 'ENR',
      'iso14064-readiness': 'ISO',
      'supply-chain-sustainability': 'SCS',
      'sustainability-leadership': 'SUS'
    };
    return codes[assessmentId] || 'GEN';
  }
  
  generateRandom(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, x => chars[x % chars.length]).join('');
  }
  
  generateFilename(slug, name) {
    const sanitisedName = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
    const date = new Date().toISOString().slice(0, 10);
    return `terrnix-certificate-${slug}-${sanitisedName}-${date}.pdf`;
  }
  
  async addBackground(doc) {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, 297, 210, 'F');
  }
  
  async addBorders(doc) {
    // Outer border
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(1);
    doc.rect(10, 10, 277, 190);
    
    // Inner border
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 267, 180);
  }
  
  async addLogo(doc, config) {
    try {
      const logoData = await this.loadImage(config.certificateRules.design?.logoUrl || '/assets/images/terrnix-logo.png');
      doc.addImage(logoData, 'PNG', 30, 25, 50, 17);
    } catch (e) {
      // Fallback: text logo
      doc.setFontSize(16);
      doc.setTextColor(5, 150, 105);
      doc.text('TERRNIX', 30, 35);
    }
  }
  
  async addTypeLabel(doc, certType) {
    doc.setFontSize(11);
    doc.setTextColor(5, 150, 105);
    doc.text(certType.label.toUpperCase(), 267, 35, { align: 'right' });
  }
  
  async addTitle(doc, certType) {
    doc.setFont('times', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(26, 26, 26);
    doc.text(certType.label, 148, 75, { align: 'center' });
  }
  
  async addSubtitle(doc) {
    doc.setFont('times', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(102, 102, 102);
    doc.text('This certificate confirms that', 148, 92, { align: 'center' });
  }
  
  async addParticipantName(doc, name) {
    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(5, 150, 105);
    doc.text(name, 148, 112, { align: 'center' });
  }
  
  async addAssessmentDetails(doc, results, config) {
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(26, 26, 26);
    
    const date = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const text = `completed the ${config.metadata.title} on ${date} and achieved a score of ${results.overall.score}/100`;
    doc.text(text, 148, 130, { align: 'center' });
  }
  
  async addMaturityBadge(doc, maturityLevel) {
    const badgeWidth = 70;
    const badgeHeight = 12;
    const x = 148 - (badgeWidth / 2);
    const y = 142;
    
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(5, 150, 105);
    doc.roundedRect(x, y, badgeWidth, badgeHeight, 6, 6, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(maturityLevel.badge, 148, y + 8, { align: 'center' });
  }
  
  async addScoreCircle(doc, score) {
    const x = 220;
    const y = 148;
    const radius = 15;
    
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(1.5);
    doc.circle(x, y, radius);
    
    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text(`${score}%`, x, y + 5, { align: 'center' });
  }
  
  async addVerification(doc, certId) {
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text(`Certificate ID: ${certId}`, 30, 165);
    
    const verifyUrl = `terrnix.com/certificate/verify/?id=${certId}`;
    doc.text(`Verify at: ${verifyUrl}`, 30, 172);
  }
  
  async addQRCode(doc, certId) {
    try {
      const verifyUrl = `https://terrnix.com/certificate/verify/?id=${certId}`;
      const qrData = await this.generateQRCode(verifyUrl);
      doc.addImage(qrData, 'PNG', 245, 158, 25, 25);
    } catch (e) {
      console.warn('QR code generation failed:', e);
    }
  }
  
  async generateQRCode(url) {
    return new Promise((resolve, reject) => {
      this.qrcode.toDataURL(url, { width: 100, margin: 2 }, (err, dataUrl) => {
        if (err) reject(err);
        else resolve(dataUrl);
      });
    });
  }
  
  async addFooter(doc, participant, config) {
    const date = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text(date, 30, 188);
    doc.text('terrnix.com', 148, 188, { align: 'center' });
    
    // Signature
    try {
      const sigData = await this.loadImage(config.certificateRules.design?.signatureUrl || '/assets/images/signature.png');
      doc.addImage(sigData, 'PNG', 240, 178, 30, 12);
    } catch (e) {
      // Fallback: line
      doc.setDrawColor(102, 102, 102);
      doc.line(240, 185, 270, 185);
    }
    
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    doc.text('Authorised Terrnix Representative', 267, 192, { align: 'right' });
  }
  
  async addDisclaimer(doc) {
    doc.setFontSize(7);
    doc.setTextColor(153, 153, 153);
    
    const disclaimer = 'This certificate recognises completion and performance in a Terrnix educational assessment. It is not a professional licence, regulatory qualification or third-party accreditation.';
    
    const lines = doc.splitTextToSize(disclaimer, 250);
    doc.text(lines, 148, 200, { align: 'center' });
  }
  
  async loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  
  save(doc, filename) {
    doc.save(filename);
  }
}
```

---

## Verification System

### Verification Page

**URL:** `https://terrnix.com/certificate/verify/?id=TRX-CAR-20260715-A7F42K`

**Valid Certificate Display:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Terrnix Logo]                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ✓ Certificate Verified                   │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Certificate ID: TRX-CAR-20260715-A7F42K                   │
│  Status: Valid                                              │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  Participant: Tallal B.                                     │
│  Assessment: Carbon Accounting Readiness Assessment         │
│  Issue Date: 15 July 2026                                   │
│  Score: 72/100                                              │
│  Maturity Level: Practitioner Achievement                   │
│                                                             │
│  ─────────────────────────────────────────────────────      │
│                                                             │
│  This certificate was issued by Terrnix.                   │
│                                                             │
│  [View Assessment]  [Contact Terrnix]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Invalid Certificate Display:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Terrnix Logo]                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    ✗ Certificate Not Found                  │
│                                                             │
│  The certificate ID you entered could not be verified.     │
│                                                             │
│  Please check the ID and try again.                        │
│                                                             │
│  If you believe this is an error, contact                  │
│  support@terrnix.com.                                       │
│                                                             │
│  [Verify Another]  [Contact Support]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Privacy Protection

**Displayed:**
- Certificate ID
- Status (Valid/Invalid)
- Participant first name + last initial (e.g., "Tallal B.")
- Assessment name
- Issue date
- Score
- Maturity level

**NOT Displayed:**
- Full name
- Email address
- Company
- Job title
- Country
- Assessment answers
- Detailed category scores

### Backend API

```javascript
// GET /api/certificate/verify?id=TRX-CAR-20260715-A7F42K
{
  "valid": true,
  "certificate": {
    "id": "TRX-CAR-20260715-A7F42K",
    "participantName": "Tallal B.",
    "assessmentName": "Carbon Accounting Readiness Assessment",
    "issueDate": "2026-07-15",
    "score": 72,
    "maturityLevel": "Practitioner Achievement"
  }
}

// Invalid response
{
  "valid": false,
  "error": "Certificate not found"
}
```

---

## Security

| Threat | Mitigation |
|--------|------------|
| Certificate forgery | Unique IDs (56 billion combinations), verification endpoint |
| ID guessing | Rate limiting (10 requests/minute per IP) |
| Email exposure | Only first name + initial on verification page |
| PDF tampering | Future: digital signature or blockchain notarisation |
| Brute force | Account lockout after 10 failed attempts per ID |

---

## Testing

### Unit Tests
```javascript
describe('CertificateEngine', () => {
  test('generates valid certificate ID', () => {
    const engine = new CertificateEngine();
    const id = engine.generateId('carbon-accounting-readiness');
    expect(id).toMatch(/^TRX-CAR-\d{8}-[A-Z0-9]{6}$/);
  });
  
  test('determines correct certificate type', () => {
    const engine = new CertificateEngine();
    const config = {
      certificateRules: {
        thresholds: [
          { min: 0, max: 49, type: 'completion', label: 'Certificate of Completion' },
          { min: 50, max: 100, type: 'achievement', label: 'Certificate of Achievement' }
        ]
      }
    };
    
    expect(engine.getCertificateType(30, config).type).toBe('completion');
    expect(engine.getCertificateType(75, config).type).toBe('achievement');
  });
  
  test('sanitises filename correctly', () => {
    const engine = new CertificateEngine();
    const filename = engine.generateFilename('carbon-readiness', 'Tallal Belkheiri');
    expect(filename).toMatch(/^terrnix-certificate-carbon-readiness-tallal-belkheiri-/);
  });
});
```

---

## Implementation Checklist

- [ ] jsPDF library self-hosted
- [ ] qrcode.js self-hosted
- [ ] CertificateEngine class implemented
- [ ] Certificate ID generation (crypto.getRandomValues)
- [ ] A4 landscape layout
- [ ] Terrnix logo integration
- [ ] Signature image integration
- [ ] Maturity badge rendering
- [ ] Score circle rendering
- [ ] QR code generation
- [ ] Verification page at `/certificate/verify/`
- [ ] Backend API `/api/certificate/verify`
- [ ] Privacy protection (no email exposure)
- [ ] Rate limiting on verification
- [ ] File size < 200KB
- [ ] No browser print dialog
- [ ] Filename sanitisation
