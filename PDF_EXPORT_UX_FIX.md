# Terrnix PDF Export UX Fix Audit

**Date:** 2026-06-18
**Auditor:** Terrnix AI
**Scope:** PDF generation across all pages
**Status:** 🟡 HIGH — UX is poor but technically functional

---

## Executive Summary

**Current Behavior:** PDF "generation" opens the browser's print dialog (`window.print()`). Users must manually select "Save as PDF" and name the file themselves. No actual PDF file is generated or downloaded automatically.

**Desired Behavior:** User clicks button → actual `.pdf` file downloads automatically with a descriptive filename like `terrnix-carbon-report-2026-06-18.pdf`.

**Severity:** 🟡 HIGH — Poor UX causes user drop-off, but data is not lost

---

## 1. Carbon Footprint Calculator (`/carbon-accounting/carbon-footprint-calculator/`)

### Current Implementation

**Button (line 810-812):**
```html
<button onclick="generatePDFReport()" class="px-4 py-2 bg-[#1a2520] ...">
  📄 Download Report
</button>
```

**Handler (`generatePDFReport()`, line 1205-1235):**
```javascript
function generatePDFReport() {
  // ... validate data ...
  const data = buildReportData();
  const html = renderReportTemplate(data);
  
  // Open in new window for print/PDF
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  
  setTimeout(() => {
    printWindow.print();  // ← Opens browser print dialog
  }, 500);
}
```

**What happens:**
1. User clicks "Download Report"
2. New tab opens with styled HTML report (9 pages)
3. Browser print dialog appears
4. User must manually:
   - Select "Save as PDF" as destination
   - Type a filename
   - Click Save

**Problems:**
- ❌ Button says "Download Report" but it doesn't download
- ❌ Requires popup permission (blocked by many browsers)
- ❌ Requires manual user action to complete "download"
- ❌ Filename is not preset (user gets generic name)
- ❌ On mobile, print dialog is confusing/unusable
- ❌ `html2pdf.js` is loaded (line 2239) but **never used**

### html2pdf.js Availability

The page loads `html2pdf.js` from CDN with SRI:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
  integrity="sha384-Yv5O+t3uE3hunW8uyrbpPW3iw6/5/Y7HitWJBLgqfMoA36NogMmy+8wWZMpn3HWc"
  crossorigin="anonymous"></script>
```

But `generatePDFReport()` never calls `html2pdf()`. The library is loaded for no purpose.

---

## 2. Homepage Sustainability Report (`index.html`)

### Current Implementation

**Button:** `exportPDF` (line 4593-4595)
```javascript
document.getElementById('exportPDF').addEventListener('click', () => {
  window.print();  // ← Prints the entire page
});
```

**What happens:**
- Prints the entire homepage, not a formatted report
- No report-specific styling
- No data export

---

## 3. Homepage Deep Dive / Intelligence Report (`index.html`)

### Current Implementation

**Handler (line 7176-7257):**
```javascript
const printWindow = window.open('', '_blank');
printWindow.document.write(`<html>...styled report HTML...</html>`);
printWindow.document.close();
printWindow.print();
```

Same pattern: opens print dialog, requires manual "Save as PDF".

---

## 4. Comparison: Current vs Desired

| Aspect | Current | Desired |
|--------|---------|---------|
| Button label | "📄 Download Report" | "📄 Generate PDF Report" or "📥 Download PDF Report" |
| User action | Click → print dialog → manually save as PDF | Click → file downloads automatically |
| Filename | User must type | Auto: `terrnix-carbon-report-YYYY-MM-DD.pdf` |
| Mobile UX | Poor (print dialog confusing) | Good (direct download) |
| Popup required | Yes | No |
| Library used | None (html2pdf.js loaded but unused) | html2pdf.js or native approach |

---

## 5. Recommended Fix

### Option A: Use html2pdf.js (Recommended)

Since `html2pdf.js` is already loaded, use it properly:

```javascript
function generatePDFReport() {
  const total = parseFloat(totals.scope1) + parseFloat(totals.scope2) + parseFloat(totals.scope3);
  if (total === 0) {
    alert('Please calculate your emissions first before generating a report.');
    return;
  }

  const data = buildReportData();
  const html = renderReportTemplate(data);
  
  // Create temporary container
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  
  const filename = `terrnix-carbon-report-${new Date().toISOString().split('T')[0]}.pdf`;
  
  const opt = {
    margin: 0,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  
  html2pdf().set(opt).from(container).save().then(() => {
    document.body.removeChild(container);
  }).catch(err => {
    console.error('PDF generation failed:', err);
    alert('PDF generation failed. Please try again.');
    document.body.removeChild(container);
  });
}
```

### Option B: Server-Side PDF Generation (Future)

For higher quality, use a backend service (Puppeteer, Playwright, or PDF library) to generate PDFs server-side. This requires:
- Backend endpoint `/api/generate-pdf`
- PDF generation library (puppeteer, playwright, pdfkit)
- File storage or direct response

**Not recommended for immediate fix** — adds complexity and server load.

---

## 6. Button Label Changes

| Location | Current | New |
|----------|---------|-----|
| Calculator | "📄 Download Report" | "📥 Download PDF Report" |
| Homepage export | "Export PDF" (if exists) | "📥 Download PDF Report" |

---

## 7. Verification Checklist

After implementation, verify on:
- [ ] Chrome (desktop) — File downloads automatically
- [ ] Edge (desktop) — File downloads automatically
- [ ] Firefox (desktop) — File downloads automatically
- [ ] Chrome (mobile/Android) — File downloads to Downloads folder
- [ ] Safari (mobile/iOS) — File opens in new tab or downloads
- [ ] Filename is `terrnix-carbon-report-YYYY-MM-DD.pdf`
- [ ] File contains all 9 pages with proper formatting
- [ ] No popup permission required
- [ ] Error handling works (shows message if generation fails)

---

## 8. Files to Modify

| File | Changes |
|------|---------|
| `carbon-accounting/carbon-footprint-calculator/index.html` | Rewrite `generatePDFReport()` to use `html2pdf.js`, rename button |
| `index.html` | Fix homepage PDF export if needed |

---

*Audit complete. Ready for implementation phase.*
