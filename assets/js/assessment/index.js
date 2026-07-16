/**
 * Terrnix Assessment Engine - Module Entry Point
 * Exports all assessment modules and provides initialisation helper
 */

// Module references (loaded via script tags or ES modules)
const AssessmentModules = {
  Engine: AssessmentEngine,
  State: AssessmentState,
  UI: AssessmentUI,
  Scoring: AssessmentScoring,
  Analytics: AssessmentAnalytics,
  Utils: AssessmentUtils
};

/**
 * Wire UI callbacks to engine methods.
 * Must be called AFTER engine.load() has initialised engine.ui.
 */
function wireAssessmentCallbacks(engine) {
  if (!engine.ui) {
    console.error('[Assessment] Cannot wire callbacks: engine.ui is null. Call load() first.');
    return;
  }

  engine.ui.onStart = () => engine.showScreen('question');
  engine.ui.onPrevious = () => engine.previous();
  engine.ui.onNext = () => engine.next();
  engine.ui.onAnswer = (questionId, value) => {
    engine.answer(questionId, value);
    engine.next();
  };
  engine.ui.onEditQuestion = (index) => engine.goToQuestion(index);
  engine.ui.onSubmit = () => engine.submit();
  engine.ui.onLeadSubmit = (e) => {
    e.preventDefault();
    handleLeadSubmit(engine, e.target);
  };
  engine.ui.onDownloadReport = () => generateAssessmentReport(engine);
  engine.ui.onDownloadCertificate = () => generateAssessmentCertificate(engine);
  engine.ui.onRecommendationClick = (rec) => {
    engine.analytics.trackRecommendationClick(rec.id, rec.type, rec.url);
  };
}

/**
 * Initialise an assessment on a container element.
 * Returns an engine instance. Call engine.load(slug).then(() => wireAssessmentCallbacks(engine))
 * before starting.
 */
function initAssessment(containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Assessment container not found: ${containerId}`);
    return null;
  }

  const engine = new AssessmentEngine(containerId, options);
  return engine;
}

/**
 * Handle lead form submission
 */
async function handleLeadSubmit(engine, form) {
  const name = form.querySelector('#leadName')?.value.trim();
  const email = form.querySelector('#leadEmail')?.value.trim();
  const company = form.querySelector('#leadCompany')?.value.trim() || null;
  const jobTitle = form.querySelector('#leadJobTitle')?.value.trim() || null;
  const industry = form.querySelector('#leadIndustry')?.value || null;
  const country = form.querySelector('#leadCountry')?.value || null;
  const consent = form.querySelector('#leadConsent')?.checked || false;
  const newsletterConsent = form.querySelector('#leadNewsletter')?.checked || false;

  // Validation
  const errors = [];
  if (!name || name.length < 2) errors.push({ field: 'leadName', message: 'Please enter your full name' });
  if (!email || !AssessmentUtils.isValidEmail(email)) errors.push({ field: 'leadEmail', message: 'Please enter a valid email address' });
  if (!consent) errors.push({ field: 'leadConsent', message: 'You must agree to receive your results' });

  // Clear previous errors
  form.querySelectorAll('.text-red-400').forEach(el => el.classList.add('hidden'));
  form.querySelectorAll('.assessment-input--error').forEach(el => el.classList.remove('assessment-input--error'));

  if (errors.length > 0) {
    errors.forEach(err => {
      const field = form.querySelector(`#${err.field}`);
      const errorEl = form.querySelector(`#${err.field}Error`);
      if (field) field.classList.add('assessment-input--error');
      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hidden');
      }
    });
    return;
  }

  // Update state
  engine.state.setParticipant({
    name,
    email,
    company,
    jobTitle,
    industry,
    country,
    consent,
    newsletterConsent,
    consentTimestamp: new Date().toISOString()
  });

  // Track analytics
  engine.analytics.trackParticipantDetails(newsletterConsent, engine.state.getTimeSpent(), window.location.href);
  engine.analytics.trackNewsletterConsent(newsletterConsent);

  // Show results
  engine.showScreen('results');

  // Persist state
  engine.state.persist();

  // Submit to backend (async, non-blocking)
  submitLeadToBackend(engine).catch(console.error);
}

/**
 * Submit lead data to backend
 */
async function submitLeadToBackend(engine) {
  const data = engine.state.exportForSubmission();

  try {
    const response = await fetch('/api/assessment/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('[Assessment] Lead submitted:', result);

  } catch (error) {
    console.warn('[Assessment] Lead submission failed:', error);
    // Non-critical: user still sees results
  }
}

/**
 * Auto-initialise assessments on page load
 */
document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('[data-assessment]');
  containers.forEach(container => {
    const slug = container.getAttribute('data-assessment');
    if (slug) {
      const engine = initAssessment(container.id, { assessmentSlug: slug });
      if (engine) {
        engine.load(slug).then(() => {
          wireAssessmentCallbacks(engine);
          engine.start();
        });
      }
    }
  });
});

/**
 * Generate professional PDF assessment report
 */
async function generateAssessmentReport(engine) {
  const results = engine.state.state.results;
  const participant = engine.state.state.participant || {};
  const config = engine.config;

  engine.analytics.trackReportDownload('assessment', results.overall.score, results.overall.maturityLevel.label);

  // Lazy-load PDF library
  if (!window.jspdf) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }
  if (!window.jspdf.jsPDF.API.autoTable) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = 20;

  // Helper: add text with wrapping
  const addText = (text, x, yPos, options = {}) => {
    const opts = { maxWidth: contentWidth, lineHeightFactor: 1.4, ...options };
    const lines = doc.splitTextToSize(text, opts.maxWidth);
    doc.text(lines, x, yPos, opts);
    return yPos + (lines.length * doc.getFontSize() * 0.352778 * opts.lineHeightFactor);
  };

  // Helper: check page break
  const checkPageBreak = (needed = 30) => {
    if (y + needed > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // === COVER PAGE ===
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 297, 'F');

  // Title
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  y = 80;
  y = addText('Carbon Accounting', margin, y, { align: 'center', maxWidth: contentWidth });
  y = addText('Readiness Assessment', margin, y + 5, { align: 'center', maxWidth: contentWidth });

  // Subtitle
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  y = addText('Professional Diagnostic Report', margin, y + 15, { align: 'center', maxWidth: contentWidth });

  // Participant info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  y = 140;
  if (participant.name) {
    y = addText(`Prepared for: ${participant.name}`, margin, y, { align: 'center', maxWidth: contentWidth });
  }
  if (participant.company) {
    y = addText(participant.company, margin, y + 5, { align: 'center', maxWidth: contentWidth });
  }
  y = addText(`Date: ${new Date().toLocaleDateString('en-GB')}`, margin, y + 10, { align: 'center', maxWidth: contentWidth });

  // Terrnix branding
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(10);
  y = 260;
  addText('terrnix.com', margin, y, { align: 'center', maxWidth: contentWidth });

  // === PAGE 2: EXECUTIVE SUMMARY ===
  doc.addPage();
  y = 20;
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  y = addText('Executive Summary', margin, y);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  y += 10;

  const summaryText = engine.ui.getExecutiveSummary(
    results.overall.maturityLevel.label,
    results.overall.score,
    Object.values(results.categories)
  );
  y = addText(summaryText, margin, y);

  // Score box
  y += 15;
  checkPageBreak(40);
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, y - 10, contentWidth, 35, 3, 3, 'F');
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text(`${results.overall.score}`, margin + 10, y + 10);
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text('out of 100', margin + 10, y + 18);
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(14);
  doc.text(results.overall.maturityLevel.label, margin + 60, y + 10);

  y += 45;

  // === CATEGORY SCORES ===
  checkPageBreak(30);
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  y = addText('Category Results', margin, y);
  y += 10;

  const catRows = Object.values(results.categories).map(cat => [
    cat.name,
    `${cat.score}%`,
    cat.score >= 70 ? 'Strong' : cat.score >= 50 ? 'Good' : cat.score >= 30 ? 'Developing' : 'Priority'
  ]);

  doc.autoTable({
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Category', 'Score', 'Status']],
    body: catRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fillColor: [30, 41, 59], textColor: [226, 232, 240] },
    alternateRowStyles: { fillColor: [15, 23, 42] },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 40, halign: 'center' }
    }
  });

  y = doc.lastAutoTable.finalY + 15;

  // === STRENGTHS ===
  if (results.strengths?.length > 0) {
    checkPageBreak(30);
    doc.setTextColor(52, 211, 153);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    y = addText('Key Strengths', margin, y);
    y += 8;

    doc.setTextColor(226, 232, 240);
    doc.setFontSize(10);
    results.strengths.forEach(s => {
      checkPageBreak(20);
      doc.setTextColor(52, 211, 153);
      doc.setFont('helvetica', 'bold');
      y = addText(`${s.name} (${s.score}%)`, margin, y);
      doc.setTextColor(226, 232, 240);
      doc.setFont('helvetica', 'normal');
      y = addText(s.description, margin + 5, y + 3);
      y += 5;
    });
  }

  // === GAPS ===
  if (results.gaps?.length > 0) {
    y += 10;
    checkPageBreak(30);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    y = addText('Priority Improvement Areas', margin, y);
    y += 8;

    doc.setTextColor(226, 232, 240);
    doc.setFontSize(10);
    results.gaps.forEach(g => {
      checkPageBreak(25);
      doc.setTextColor(251, 191, 36);
      doc.setFont('helvetica', 'bold');
      y = addText(`${g.name} (${g.score}%) - Risk: ${g.risk}`, margin, y);
      doc.setTextColor(226, 232, 240);
      doc.setFont('helvetica', 'normal');
      y = addText(g.description, margin + 5, y + 3);
      y += 5;
    });
  }

  // === ACTION ROADMAP ===
  doc.addPage();
  y = 20;
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  y = addText('Your Action Roadmap', margin, y);
  y += 10;

  const phases = [
    { label: 'Immediate (30 days)', color: [52, 211, 153] },
    { label: 'Build Momentum (60 days)', color: [45, 212, 191] },
    { label: 'Embed Practice (90 days)', color: [56, 189, 248] }
  ];

  phases.forEach((phase, idx) => {
    checkPageBreak(40);
    doc.setTextColor(...phase.color);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    y = addText(phase.label, margin, y);
    y += 5;

    const actions = engine.ui.getRoadmapActions(results.gaps, (idx + 1) * 30);
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    actions.forEach(action => {
      checkPageBreak(15);
      y = addText(`\u2022 ${action}`, margin + 5, y);
      y += 3;
    });
    y += 8;
  });

  // === METHODOLOGY & DISCLAIMER ===
  doc.addPage();
  y = 20;
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  y = addText('Methodology', margin, y);
  y += 8;

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y = addText('This assessment evaluates carbon accounting readiness across five critical dimensions: Governance and Accountability, Organisational Boundaries and Methodology, Emissions Data and Calculation Quality, Scope 3 and Supplier Engagement, and Reporting, Targets and Improvement. Each dimension is scored on a scale of 0 to 100 based on responses to five questions per category. The overall score is a weighted average of category scores. Maturity levels are defined as: Initial (0-29), Developing (30-49), Established (50-69), Advanced (70-84), and Leading (85-100).', margin, y);

  y += 20;
  doc.setTextColor(148, 163, 184);
  y = addText('Disclaimer: This assessment provides a diagnostic view of your carbon accounting readiness based on your responses. It is not a professional audit, regulatory certification, or substitute for independent assurance. Results should be used as a starting point for internal discussion and planning.', margin, y);

  // Footer on all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Terrnix Carbon Accounting Readiness Assessment | Page ${i} of ${pageCount}`, margin, 290);
    doc.text('terrnix.com', pageWidth - margin - 20, 290);
  }

  // Download
  const filename = `terrnix-carbon-accounting-readiness-report-${(participant.name || 'anonymous').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * Generate certificate PDF
 */
async function generateAssessmentCertificate(engine) {
  const results = engine.state.state.results;
  const participant = engine.state.state.participant || {};
  const config = engine.config;
  const score = results.overall.score;

  engine.analytics.trackCertificateDownload(score, results.overall.maturityLevel.label);

  // Determine certificate type
  let certType = 'Certificate of Completion';
  let achievementLabel = '';
  if (score >= 85) { certType = 'Certificate of Achievement'; achievementLabel = 'Advanced Achievement'; }
  else if (score >= 70) { certType = 'Certificate of Achievement'; achievementLabel = 'Practitioner Achievement'; }
  else if (score >= 50) { certType = 'Certificate of Achievement'; achievementLabel = 'Foundation Achievement'; }

  // Generate unique ID
  const certId = 'TX-' + Array.from({ length: 16 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

  // Lazy-load PDF library
  if (!window.jspdf) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: [297, 210] }); // A4 landscape
  const w = 297;
  const h = 210;

  // Background
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, w, h, 'F');

  // Border
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(1);
  doc.rect(10, 10, w - 20, h - 20);
  doc.setLineWidth(0.5);
  doc.rect(14, 14, w - 28, h - 28);

  // Terrnix logo area (text-based)
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TERRNIX', 25, 30);

  // Certificate title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(certType.toUpperCase(), w / 2, 55, { align: 'center' });

  // Achievement label
  if (achievementLabel) {
    doc.setTextColor(52, 211, 153);
    doc.setFontSize(16);
    doc.text(achievementLabel.toUpperCase(), w / 2, 68, { align: 'center' });
  }

  // Participant name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(participant.name || 'Participant', w / 2, 95, { align: 'center' });

  // Description
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const desc = `has successfully completed the ${config.metadata?.title || 'Carbon Accounting Readiness Assessment'} on ${new Date().toLocaleDateString('en-GB')} with a score of ${score}/100, achieving the maturity level of ${results.overall.maturityLevel.label}.`;
  const descLines = doc.splitTextToSize(desc, 220);
  doc.text(descLines, w / 2, 110, { align: 'center' });

  // Score circle
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(2);
  doc.circle(w / 2, 140, 18);
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${score}`, w / 2, 143, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('/100', w / 2, 150, { align: 'center' });

  // Certificate ID and verification
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Certificate ID: ${certId}`, 25, 180);
  doc.text(`Verify at: terrnix.com/certificate/verify/?id=${certId}`, 25, 188);

  // Date
  doc.text(`Issued: ${new Date().toLocaleDateString('en-GB')}`, w - 80, 180);

  // Disclaimer
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  const disclaimer = 'This certificate recognises completion and performance in a Terrnix educational assessment. It is not a professional licence, regulatory qualification or third-party accreditation.';
  const discLines = doc.splitTextToSize(disclaimer, 250);
  doc.text(discLines, w / 2, 200, { align: 'center' });

  // Download
  const filename = `terrnix-certificate-carbon-accounting-${(participant.name || 'anonymous').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);

  // Store certificate reference (would normally go to backend)
  console.log('[Assessment] Certificate generated:', certId);
}

/**
 * Dynamically load a script
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AssessmentModules, initAssessment };
}
