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
  try {
    engine.showScreen('results');
  } catch (err) {
    console.error('[Assessment] Failed to show results:', err);
    engine.ui.renderError('Unable to display results. Please refresh and try again.');
  }

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

  // Decorative top accent
  doc.setFillColor(52, 211, 153); // emerald-400
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Terrnix branding at top
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TERRNIX', margin, 25);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sustainability Intelligence', margin, 30);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  y = 90;
  y = addText('Carbon Accounting', margin, y, { align: 'center', maxWidth: contentWidth });
  doc.setTextColor(52, 211, 153);
  y = addText('Readiness Assessment', margin, y + 8, { align: 'center', maxWidth: contentWidth });

  // Subtitle
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  y = addText('Professional Diagnostic Report', margin, y + 12, { align: 'center', maxWidth: contentWidth });

  // Horizontal divider
  y += 20;
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(0.5);
  doc.line(margin + 40, y, pageWidth - margin - 40, y);

  // Participant info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  y = 160;
  if (participant.name) {
    doc.setFont('helvetica', 'bold');
    y = addText(`Prepared for ${participant.name}`, margin, y, { align: 'center', maxWidth: contentWidth });
    doc.setFont('helvetica', 'normal');
  }
  if (participant.company) {
    y = addText(participant.company, margin, y + 6, { align: 'center', maxWidth: contentWidth });
  }
  if (participant.title) {
    y = addText(participant.title, margin, y + 6, { align: 'center', maxWidth: contentWidth });
  }
  doc.setTextColor(148, 163, 184);
  y = addText(`Assessment completed on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin, y + 10, { align: 'center', maxWidth: contentWidth });

  // Score preview on cover
  y += 25;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth/2 - 35, y - 5, 70, 40, 5, 5, 'F');
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(`${results.overall.score}`, pageWidth/2, y + 18, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('out of 100', pageWidth/2, y + 28, { align: 'center' });

  // Bottom branding
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  y = 275;
  doc.text('terrnix.com | Confidential Assessment Report', margin, y);
  doc.text(`Report ID: RPT-${Date.now().toString(36).toUpperCase()}`, pageWidth - margin - 60, y);

  // === PAGE 2: EXECUTIVE SUMMARY ===
  doc.addPage();
  y = 20;
  
  // Section header with accent
  doc.setFillColor(52, 211, 153);
  doc.rect(margin, y, 3, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  y = addText('Executive Summary', margin + 10, y + 13);
  y += 15;

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');

  const summaryText = engine.ui.getExecutiveSummary(
    results.overall.maturityLevel.label,
    results.overall.score,
    Object.values(results.categories)
  );
  y = addText(summaryText, margin, y);

  // Score and maturity highlight box
  y += 20;
  checkPageBreak(50);
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(margin, y - 8, contentWidth, 45, 4, 4, 'F');
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y - 8, contentWidth, 45, 4, 4, 'S');
  
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.text(`${results.overall.score}`, margin + 15, y + 18);
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('out of 100', margin + 15, y + 28);
  
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(results.overall.maturityLevel.label, margin + 80, y + 18);
  
  // Maturity level description
  const maturityDesc = {
    'Initial': 'Early stage: foundational awareness with significant gaps',
    'Developing': 'Emerging capability: some processes in place, consistency needed',
    'Established': 'Solid foundation: core processes documented and operational',
    'Advanced': 'Well-integrated: strong data quality and consistent reporting',
    'Leading': 'Best practice: deeply embedded in governance and strategy'
  };
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(maturityDesc[results.overall.maturityLevel.label] || '', 80);
  doc.text(descLines, margin + 80, y + 26);

  y += 55;

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

  // Background with subtle gradient effect (simulated with rectangles)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, w, h, 'F');
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, w, 60, 'F');

  // Top accent bar
  doc.setFillColor(52, 211, 153);
  doc.rect(0, 0, w, 3, 'F');

  // Corner decorations
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(1.5);
  // Top-left corner
  doc.line(15, 15, 15, 35);
  doc.line(15, 15, 35, 15);
  // Top-right corner
  doc.line(w - 15, 15, w - 15, 35);
  doc.line(w - 15, 15, w - 35, 15);
  // Bottom-left corner
  doc.line(15, h - 15, 15, h - 35);
  doc.line(15, h - 15, 35, h - 15);
  // Bottom-right corner
  doc.line(w - 15, h - 15, w - 15, h - 35);
  doc.line(w - 15, h - 15, w - 35, h - 15);

  // Terrnix branding
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TERRNIX', 25, 25);
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sustainability Intelligence', 25, 32);

  // Certificate type badge
  doc.setFillColor(52, 211, 153);
  const certTypeWidth = doc.getTextWidth(certType.toUpperCase()) + 20;
  doc.roundedRect(w/2 - certTypeWidth/2, 42, certTypeWidth, 22, 3, 3, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(certType.toUpperCase(), w / 2, 56, { align: 'center' });

  // Achievement label
  if (achievementLabel) {
    doc.setTextColor(52, 211, 153);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(achievementLabel, w / 2, 78, { align: 'center' });
  }

  // Decorative line
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(0.5);
  doc.line(w/2 - 60, 85, w/2 + 60, 85);

  // Participant name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(participant.name || 'Participant', w / 2, 105, { align: 'center' });

  // Description
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const desc = `has successfully completed the ${config.metadata?.title || 'Carbon Accounting Readiness Assessment'} on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} with a score of ${score} out of 100, achieving the maturity level of ${results.overall.maturityLevel.label}.`;
  const descLines = doc.splitTextToSize(desc, 200);
  doc.text(descLines, w / 2, 118, { align: 'center' });

  // Score display with background
  const scoreY = 150;
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(w/2 - 30, scoreY - 15, 60, 45, 5, 5, 'F');
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(1);
  doc.roundedRect(w/2 - 30, scoreY - 15, 60, 45, 5, 5, 'S');
  
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`${score}`, w / 2, scoreY + 8, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('out of 100', w / 2, scoreY + 20, { align: 'center' });

  // Bottom section with details
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Certificate ID: ${certId}`, 25, h - 30);
  doc.text(`Verify: terrnix.com/certificate/verify/?id=${certId}`, 25, h - 22);
  
  // QR code placeholder
  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(0.5);
  doc.roundedRect(w - 55, h - 55, 35, 35, 2, 2, 'S');
  doc.setTextColor(52, 211, 153);
  doc.setFontSize(6);
  doc.text('QR CODE', w - 37.5, h - 37.5, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  doc.text('Scan to verify', w - 37.5, h - 18, { align: 'center' });

  // Date
  doc.text(`Issued: ${new Date().toLocaleDateString('en-GB')}`, w - 80, h - 30);

  // Disclaimer
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7);
  const disclaimer = 'This certificate recognises completion and performance in a Terrnix educational assessment. It is not a professional licence, regulatory qualification or third-party accreditation.';
  const discLines = doc.splitTextToSize(disclaimer, 180);
  doc.text(discLines, w / 2, h - 12, { align: 'center' });

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
