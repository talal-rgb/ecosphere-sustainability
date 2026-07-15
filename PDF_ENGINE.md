# Terrnix PDF Engine Specification

**Status:** SPECIFICATION  
**Date:** 2026-07-15  
**Version:** 1.0  
**Classification:** Core Infrastructure

---

## Philosophy

The PDF Engine generates professional, consulting-quality documents that reinforce Terrnix's premium positioning. Every PDF must feel like a deliverable from a top-tier advisory firm.

**Core Principles:**
1. **Professional:** Clean typography, consistent branding, no clutter
2. **Accessible:** PDFs are readable, searchable, and screen-reader friendly
3. **Lightweight:** Sub-1MB reports, sub-200KB certificates
4. **Self-contained:** No external dependencies after generation
5. **Fast:** Generation under 2 seconds

---

## Technology Stack

| Component | Technology | Version | Size |
|-----------|-----------|---------|------|
| PDF Generation | jsPDF | 2.5.1 | ~85KB |
| HTML to Canvas | html2canvas | 1.4.1 | ~65KB |
| QR Code | qrcode.js | 1.5.3 | ~25KB |
| Charts | Chart.js | 4.4.0 | ~60KB (already loaded) |
| **Total (lazy-loaded)** | | | **~235KB** |

**Loading Strategy:**
- All PDF dependencies lazy-loaded on first download request
- Preload hint: `<link rel="preload" href="assets/vendor/jspdf.umd.min.js" as="script">`
- Service worker caches dependencies after first load

---

## 1. PDF Engine Class

```javascript
class PDFEngine {
  constructor() {
    this.dependenciesLoaded = false;
    this.jsPDF = null;
    this.html2canvas = null;
    this.qrcode = null;
  }
  
  async loadDependencies() {
    if (this.dependenciesLoaded) return;
    
    // Load in parallel
    const [jsPDF, html2canvas, qrcode] = await Promise.all([
      import('/assets/vendor/jspdf.umd.min.js'),
      import('/assets/vendor/html2canvas.min.js'),
      import('/assets/vendor/qrcode.min.js')
    ]);
    
    this.jsPDF = jsPDF.jsPDF;
    this.html2canvas = html2canvas.default;
    this.qrcode = qrcode.default;
    this.dependenciesLoaded = true;
  }
  
  async generateReport(results, recommendations, participant, config) {
    await this.loadDependencies();
    
    const doc = new this.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Add each section
    await this.addCoverPage(doc, results, participant, config);
    await this.addExecutiveSummary(doc, results, recommendations);
    await this.addScoreOverview(doc, results);
    await this.addCategoryBreakdown(doc, results);
    await this.addStrengths(doc, results);
    await this.addGaps(doc, results);
    await this.addRecommendations(doc, recommendations);
    await this.addRoadmap(doc, recommendations);
    await this.addResources(doc, recommendations);
    await this.addMethodology(doc, config);
    await this.addDisclaimer(doc);
    
    // Add headers/footers
    this.addHeadersAndFooters(doc, config);
    
    return doc;
  }
  
  async generateCertificate(results, participant, config) {
    await this.loadDependencies();
    
    const doc = new this.jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    await this.addCertificateContent(doc, results, participant, config);
    
    return doc;
  }
  
  save(doc, filename) {
    doc.save(filename);
  }
  
  async generateQRCode(url) {
    return new Promise((resolve) => {
      this.qrcode.toDataURL(url, { width: 100, margin: 2 }, (err, dataUrl) => {
        resolve(dataUrl);
      });
    });
  }
}
```

---

## 2. Report PDF (Portrait A4)

### Page Specifications

| Property | Value |
|----------|-------|
| Orientation | Portrait |
| Format | A4 (210mm × 297mm) |
| Margins | 20mm left/right, 25mm top, 20mm bottom |
| Font | Inter (sans-serif) |
| Primary Colour | #059669 (Terrnix emerald) |
| Text Colour | #1a1a1a (dark charcoal) |
| Background | #ffffff (white) |

### Page 1: Cover Page

```javascript
async addCoverPage(doc, results, participant, config) {
  // Background gradient (subtle)
  doc.setFillColor(5, 150, 105); // emerald-500
  doc.rect(0, 0, 210, 297, 'F');
  
  // White content area
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(15, 15, 180, 267, 5, 5, 'F');
  
  // Logo
  const logoData = await this.loadImage('/assets/images/terrnix-logo.png');
  doc.addImage(logoData, 'PNG', 30, 40, 50, 17);
  
  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(26, 26, 26);
  doc.text('Sustainability Assessment Report', 30, 100);
  
  // Assessment name
  doc.setFontSize(18);
  doc.setTextColor(5, 150, 105);
  doc.text(config.metadata.title, 30, 120);
  
  // Participant info
  doc.setFontSize(14);
  doc.setTextColor(102, 102, 102);
  doc.text(`Prepared for: ${participant.name}`, 30, 150);
  if (participant.company) {
    doc.text(`${participant.company}`, 30, 165);
  }
  doc.text(`Date: ${this.formatDate(new Date())}`, 30, 180);
  
  // Confidentiality notice
  doc.setFontSize(10);
  doc.setTextColor(153, 153, 153);
  doc.text('This report is confidential and prepared exclusively for the named recipient.', 30, 250);
  
  // Page break
  doc.addPage();
}
```

### Page 2: Executive Summary

```javascript
async addExecutiveSummary(doc, results, recommendations) {
  this.addSectionHeader(doc, 'Executive Summary');
  
  // Overall score box
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.roundedRect(20, 50, 170, 60, 3, 3, 'F');
  
  // Score
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(5, 150, 105);
  doc.text(`${results.overall.score}`, 40, 90);
  
  doc.setFontSize(14);
  doc.setTextColor(102, 102, 102);
  doc.text('/100', 80, 90);
  
  // Maturity level
  doc.setFillColor(5, 150, 105);
  doc.roundedRect(110, 70, 60, 20, 10, 10, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(results.overall.maturityLevel.label, 140, 83, { align: 'center' });
  
  // Summary text
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 26);
  const summary = recommendations.executiveSummary;
  const splitSummary = doc.splitTextToSize(summary, 170);
  doc.text(splitSummary, 20, 130);
  
  // Key findings
  this.addSubHeader(doc, 'Key Findings', 170);
  
  const findings = [
    `Overall maturity: ${results.overall.maturityLevel.label} (${results.overall.score}/100)`,
    `Strongest area: ${results.strengths[0]?.name || 'N/A'}`,
    `Priority gap: ${results.gaps[0]?.name || 'N/A'}`
  ];
  
  let y = 185;
  for (const finding of findings) {
    doc.setTextColor(5, 150, 105);
    doc.text('•', 25, y);
    doc.setTextColor(26, 26, 26);
    doc.text(finding, 35, y);
    y += 12;
  }
}
```

### Page 3: Score Overview with Radar Chart

```javascript
async addScoreOverview(doc, results) {
  this.addSectionHeader(doc, 'Score Overview');
  
  // Generate radar chart as image
  const chartCanvas = await this.generateRadarChart(results.categories);
  const chartData = chartCanvas.toDataURL('image/png');
  
  // Add chart
  doc.addImage(chartData, 'PNG', 20, 50, 170, 100);
  
  // Category scores table
  this.addSubHeader(doc, 'Category Breakdown', 160);
  
  let y = 175;
  for (const category of Object.values(results.categories)) {
    // Category name
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text(category.name, 20, y);
    
    // Score bar
    const barWidth = 80;
    const fillWidth = (category.score / 100) * barWidth;
    
    doc.setFillColor(229, 231, 235); // gray-200
    doc.roundedRect(90, y - 5, barWidth, 8, 2, 2, 'F');
    
    doc.setFillColor(5, 150, 105); // emerald-500
    doc.roundedRect(90, y - 5, fillWidth, 8, 2, 2, 'F');
    
    // Score text
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text(`${category.score}%`, 180, y);
    
    y += 18;
  }
}
```

### Page 4: Strengths

```javascript
async addStrengths(doc, results) {
  this.addSectionHeader(doc, 'Your Strengths');
  
  let y = 50;
  for (const strength of results.strengths) {
    // Strength card
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.roundedRect(20, y, 170, 50, 3, 3, 'F');
    
    // Category name
    doc.setFontSize(14);
    doc.setTextColor(5, 150, 105);
    doc.text(`${strength.name}: ${strength.score}%`, 30, y + 15);
    
    // Description
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    const desc = doc.splitTextToSize(strength.description, 150);
    doc.text(desc, 30, y + 28);
    
    y += 60;
  }
}
```

### Page 5: Priority Gaps

```javascript
async addGaps(doc, results) {
  this.addSectionHeader(doc, 'Priority Gaps');
  
  let y = 50;
  for (const gap of results.gaps) {
    // Gap card
    const riskColours = {
      'Critical': { bg: [254, 242, 242], text: [239, 68, 68] },   // red
      'High': { bg: [255, 251, 235], text: [245, 158, 11] },      // amber
      'Medium': { bg: [255, 251, 235], text: [245, 158, 11] },    // amber
      'Low': { bg: [240, 253, 244], text: [34, 197, 94] }         // green
    };
    
    const colour = riskColours[gap.risk] || riskColours['Medium'];
    
    doc.setFillColor(...colour.bg);
    doc.roundedRect(20, y, 170, 60, 3, 3, 'F');
    
    // Risk badge
    doc.setFillColor(...colour.text);
    doc.roundedRect(30, y + 8, 40, 12, 6, 6, 'F');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(gap.risk, 50, y + 16, { align: 'center' });
    
    // Category name
    doc.setFontSize(14);
    doc.setTextColor(...colour.text);
    doc.text(`${gap.name}: ${gap.score}%`, 80, y + 18);
    
    // Description
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 26);
    const desc = doc.splitTextToSize(gap.description, 150);
    doc.text(desc, 30, y + 35);
    
    y += 70;
  }
}
```

### Page 6: Recommended Actions

```javascript
async addRecommendations(doc, recommendations) {
  this.addSectionHeader(doc, 'Recommended Actions');
  
  let y = 50;
  for (let i = 0; i < recommendations.priority.length; i++) {
    const rec = recommendations.priority[i];
    
    // Priority number
    doc.setFillColor(5, 150, 105);
    doc.circle(35, y + 5, 8, 'F');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(String(i + 1), 35, y + 9, { align: 'center' });
    
    // Title
    doc.setFontSize(13);
    doc.setTextColor(26, 26, 26);
    doc.text(rec.title, 50, y + 8);
    
    // Description
    doc.setFontSize(10);
    const desc = doc.splitTextToSize(rec.description, 140);
    doc.text(desc, 50, y + 20);
    
    // Meta
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    doc.text(`Impact: ${rec.impact} | Difficulty: ${rec.difficulty} | Timeframe: ${rec.timeframe}`, 50, y + 40);
    
    y += 55;
  }
}
```

### Page 7: 30-60-90 Day Roadmap

```javascript
async addRoadmap(doc, recommendations) {
  this.addSectionHeader(doc, '30-60-90 Day Roadmap');
  
  const columns = [
    { title: '30 Days', subtitle: 'Foundation', data: recommendations.roadmap.days30 },
    { title: '60 Days', subtitle: 'Development', data: recommendations.roadmap.days60 },
    { title: '90 Days', subtitle: 'Maturity', data: recommendations.roadmap.days90 }
  ];
  
  const colWidth = 55;
  const startX = 20;
  
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const x = startX + (i * (colWidth + 5));
    
    // Column header
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(x, 50, colWidth, 25, 3, 3, 'F');
    
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(col.title, x + colWidth/2, 63, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(col.subtitle, x + colWidth/2, 72, { align: 'center' });
    
    // Actions
    let y = 85;
    for (const action of col.data.actions || []) {
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(x, y, colWidth, 35, 2, 2, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      const title = doc.splitTextToSize(action.title, colWidth - 10);
      doc.text(title, x + 5, y + 12);
      
      doc.setFontSize(8);
      doc.setTextColor(102, 102, 102);
      doc.text(`${action.impact} impact | ${action.difficulty}`, x + 5, y + 28);
      
      y += 40;
    }
  }
}
```

### Page 8: Resources

```javascript
async addResources(doc, recommendations) {
  this.addSectionHeader(doc, 'Recommended Resources');
  
  let y = 50;
  
  // Articles
  if (recommendations.articles?.length > 0) {
    this.addSubHeader(doc, 'Intelligence Articles', y);
    y += 15;
    
    for (const article of recommendations.articles) {
      doc.setFontSize(11);
      doc.setTextColor(5, 150, 105);
      doc.text('→', 20, y);
      
      doc.setTextColor(26, 26, 26);
      doc.text(article.title, 30, y);
      
      doc.setFontSize(9);
      doc.setTextColor(102, 102, 102);
      const desc = doc.splitTextToSize(article.description, 160);
      doc.text(desc, 30, y + 8);
      
      y += 25;
    }
  }
  
  // Calculators
  if (recommendations.calculators?.length > 0) {
    y += 10;
    this.addSubHeader(doc, 'Calculators & Tools', y);
    y += 15;
    
    for (const calc of recommendations.calculators) {
      doc.setFontSize(11);
      doc.setTextColor(5, 150, 105);
      doc.text('→', 20, y);
      
      doc.setTextColor(26, 26, 26);
      doc.text(calc.title, 30, y);
      
      y += 15;
    }
  }
  
  // Consultation CTA
  y += 20;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(20, y, 170, 50, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(5, 150, 105);
  doc.text('Need Expert Guidance?', 30, y + 20);
  
  doc.setFontSize(10);
  doc.setTextColor(26, 26, 26);
  doc.text('Book a free 30-minute consultation with a Terrnix sustainability expert.', 30, y + 35);
}
```

### Page 9: Methodology

```javascript
async addMethodology(doc, config) {
  this.addSectionHeader(doc, 'Methodology');
  
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 26);
  
  const text = `
This assessment evaluates carbon accounting maturity across five dimensions: Governance, Data Collection, Reporting, Targets, and Stakeholder Engagement.

Scoring Methodology:
• Each question is scored on a 0-100 scale based on the selected answer
• Category scores are weighted averages of question scores
• Overall score is a weighted average of category scores
• Weights reflect the relative importance of each dimension

Maturity Levels:
• Foundation (0-49): Early stage development
• Developing (50-69): Core processes established
• Practitioner (70-84): Mature, operational processes
• Advanced (85-100): Leading practice, continuous improvement

Limitations:
This assessment provides a directional evaluation based on self-reported information. It does not replace a formal audit or third-party verification.
  `;
  
  const lines = doc.splitTextToSize(text.trim(), 170);
  doc.text(lines, 20, 50);
}
```

### Page 10: Disclaimer

```javascript
async addDisclaimer(doc) {
  this.addSectionHeader(doc, 'Disclaimer');
  
  doc.setFontSize(10);
  doc.setTextColor(102, 102, 102);
  
  const text = `
This report is generated based on responses provided during the Terrnix Sustainability Assessment. The results, recommendations, and roadmap are intended for educational and planning purposes only.

Terrnix does not guarantee specific outcomes from following the recommendations in this report. Organisations should seek professional advice tailored to their specific circumstances before making significant investments or strategic decisions.

This report does not constitute professional advice, regulatory consultation, or formal certification. For professional sustainability consulting services, contact Terrnix at terrnix.com.

© 2026 Terrnix. All rights reserved.
  `;
  
  const lines = doc.splitTextToSize(text.trim(), 170);
  doc.text(lines, 20, 50);
}
```

### Headers and Footers

```javascript
addHeadersAndFooters(doc, config) {
  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Skip cover page
    if (i === 1) continue;
    
    // Header
    doc.setFontSize(8);
    doc.setTextColor(153, 153, 153);
    doc.text(config.metadata.title, 20, 15);
    doc.text('Terrnix', 190, 15, { align: 'right' });
    
    // Line
    doc.setDrawColor(229, 231, 235);
    doc.line(20, 18, 190, 18);
    
    // Footer
    doc.text(`Page ${i - 1} of ${pageCount - 1}`, 105, 285, { align: 'center' });
    doc.text('Confidential', 190, 285, { align: 'right' });
    
    // Line
    doc.line(20, 282, 190, 282);
  }
}
```

---

## 3. Certificate PDF (Landscape A4)

### Page Specifications

| Property | Value |
|----------|-------|
| Orientation | Landscape |
| Format | A4 (297mm × 210mm) |
| Margins | 20mm all sides |
| Font | Georgia (serif) for title, Inter for body |
| Primary Colour | #059669 |

### Certificate Content

```javascript
async addCertificateContent(doc, results, participant, config) {
  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, 297, 210, 'F');
  
  // Border
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(1);
  doc.rect(10, 10, 277, 190);
  
  // Inner border
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, 267, 180);
  
  // Logo (top left)
  const logoData = await this.loadImage('/assets/images/terrnix-logo.png');
  doc.addImage(logoData, 'PNG', 30, 30, 60, 20);
  
  // Certificate type (top right)
  const certType = this.getCertificateType(results.overall.score, config);
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text(certType.label.toUpperCase(), 267, 40, { align: 'right' });
  
  // Title
  doc.setFont('times', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(26, 26, 26);
  doc.text('Certificate of Achievement', 148, 80, { align: 'center' });
  
  // Subtitle
  doc.setFont('times', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(102, 102, 102);
  doc.text('This certificate confirms that', 148, 100, { align: 'center' });
  
  // Participant name
  doc.setFont('times', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(5, 150, 105);
  doc.text(participant.name, 148, 120, { align: 'center' });
  
  // Assessment details
  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(26, 26, 26);
  const details = `completed the ${config.metadata.title} on ${this.formatDate(new Date())} and achieved a score of ${results.overall.score}/100`;
  doc.text(details, 148, 140, { align: 'center' });
  
  // Maturity badge
  const level = results.overall.maturityLevel;
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(5, 150, 105);
  doc.roundedRect(118, 150, 60, 20, 10, 10, 'FD');
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  doc.text(level.badge, 148, 163, { align: 'center' });
  
  // Score circle
  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(2);
  doc.circle(200, 160, 20);
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text(`${results.overall.score}%`, 200, 165, { align: 'center' });
  
  // Certificate ID
  const certId = this.generateCertificateId(config.id);
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text(`Certificate ID: ${certId}`, 30, 180);
  
  // Verification URL
  const verifyUrl = `terrnix.com/certificate/verify/?id=${certId}`;
  doc.text(`Verify at: ${verifyUrl}`, 30, 188);
  
  // QR Code
  const qrData = await this.generateQRCode(`https://${verifyUrl}`);
  doc.addImage(qrData, 'PNG', 240, 165, 30, 30);
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(102, 102, 102);
  doc.text(this.formatDate(new Date()), 30, 200);
  doc.text('terrnix.com', 148, 200, { align: 'center' });
  
  // Signature
  doc.setFontSize(8);
  doc.setTextColor(153, 153, 153);
  doc.text('Authorised Terrnix Representative', 267, 200, { align: 'right' });
  
  // Disclaimer
  doc.setFontSize(7);
  doc.setTextColor(153, 153, 153);
  const disclaimer = 'This certificate recognises completion and performance in a Terrnix educational assessment. It is not a professional licence, regulatory qualification or third-party accreditation.';
  doc.text(disclaimer, 148, 205, { align: 'center' });
}
```

---

## 4. Chart Generation

### Radar Chart

```javascript
async generateRadarChart(categories) {
  // Create hidden canvas
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  
  // Chart.js configuration
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: Object.values(categories).map(c => c.name),
      datasets: [{
        label: 'Your Score',
        data: Object.values(categories).map(c => c.score),
        backgroundColor: 'rgba(5, 150, 105, 0.2)',
        borderColor: 'rgba(5, 150, 105, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(5, 150, 105, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(5, 150, 105, 1)'
      }]
    },
    options: {
      responsive: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          angleLines: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          pointLabels: {
            color: 'rgba(255, 255, 255, 0.9)',
            font: { size: 12 }
          }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
  
  return canvas;
}
```

---

## 5. File Naming

### Report
```
terrnix-assessment-report-{assessment-id}-{participant-name}-{date}.pdf

Example:
terrnix-assessment-report-carbon-readiness-tallal-belkheiri-2026-07-15.pdf
```

### Certificate
```
terrnix-certificate-{assessment-id}-{participant-name}-{date}.pdf

Example:
terrnix-certificate-carbon-readiness-tallal-belkheiri-2026-07-15.pdf
```

**Sanitisation:**
```javascript
function sanitiseFilename(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50);
}
```

---

## 6. Performance Optimisation

### Lazy Loading
```javascript
// Only load when user clicks download
async function onDownloadClick() {
  showLoadingState();
  
  const pdfEngine = new PDFEngine();
  await pdfEngine.loadDependencies();
  
  const doc = await pdfEngine.generateReport(...);
  pdfEngine.save(doc, filename);
  
  hideLoadingState();
}
```

### Caching
```javascript
// Cache generated PDFs in memory
const pdfCache = new Map();

function getCachedPdf(key) {
  return pdfCache.get(key);
}

function cachePdf(key, doc) {
  pdfCache.set(key, doc);
  // Limit cache size
  if (pdfCache.size > 10) {
    const firstKey = pdfCache.keys().next().value;
    pdfCache.delete(firstKey);
  }
}
```

### Image Optimisation
```javascript
async function loadImage(url, maxWidth = 300) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Resize if too large
      if (img.width > maxWidth) {
        const canvas = document.createElement('canvas');
        canvas.width = maxWidth;
        canvas.height = (img.height / img.width) * maxWidth;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      } else {
        resolve(url);
      }
    };
    img.src = url;
  });
}
```

---

## 7. Testing

### Unit Tests
```javascript
describe('PDFEngine', () => {
  test('loads dependencies on first use', async () => {
    const engine = new PDFEngine();
    expect(engine.dependenciesLoaded).toBe(false);
    await engine.loadDependencies();
    expect(engine.dependenciesLoaded).toBe(true);
  });
  
  test('generates report with correct page count', async () => {
    const engine = new PDFEngine();
    const doc = await engine.generateReport(mockResults, mockRecommendations, mockParticipant, mockConfig);
    expect(doc.internal.getNumberOfPages()).toBe(10);
  });
  
  test('generates certificate in landscape', async () => {
    const engine = new PDFEngine();
    const doc = await engine.generateCertificate(mockResults, mockParticipant, mockConfig);
    expect(doc.internal.pageSize.getWidth()).toBe(297);
    expect(doc.internal.pageSize.getHeight()).toBe(210);
  });
});
```

---

## 8. Implementation Checklist

- [ ] jsPDF library self-hosted at `/assets/vendor/jspdf.umd.min.js`
- [ ] html2canvas self-hosted at `/assets/vendor/html2canvas.min.js`
- [ ] qrcode.js self-hosted at `/assets/vendor/qrcode.min.js`
- [ ] PDFEngine class implemented
- [ ] Report generation (10 pages)
- [ ] Certificate generation (landscape A4)
- [ ] Radar chart generation
- [ ] QR code generation
- [ ] File naming sanitisation
- [ ] Lazy loading implemented
- [ ] Loading states added
- [ ] Error handling
- [ ] File size < 1MB (report), < 200KB (certificate)
- [ ] No browser print dialog
