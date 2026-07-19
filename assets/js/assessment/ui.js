/**
 * Terrnix Assessment Engine - UI Renderer
 * Renders all assessment screens. Pure functions. No business logic.
 */

class AssessmentUI {
  constructor(container, config, state) {
    this.container = container;
    this.config = config;
    this.state = state;
    this.keyboardHandler = null;
  }

  /**
   * Clear container
   */
  clear() {
    this.container.innerHTML = '';
  }

  /**
   * Create base element with common classes
   */
  createElement(tag, classes = '', attrs = {}) {
    const el = document.createElement(tag);
    if (classes) el.className = classes;
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
    return el;
  }

  /**
   * Render intro screen
   */
  renderIntro() {
    this.clear();
    const ui = this.config.ui || {};
    const intro = ui.intro || {};
    const meta = this.config.metadata || {};
    const preview = intro.preview || {};

    const wrapper = this.createElement('div', 'assessment-intro max-w-6xl mx-auto py-12 px-6');

    // Two-column layout: copy left, preview right
    const grid = this.createElement('div', 'grid lg:grid-cols-2 gap-12 items-center');

    // LEFT COLUMN: Copy
    const leftCol = this.createElement('div', 'text-center lg:text-left');

    // Trust badge
    const trustBadge = this.createElement('div', 'inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6');
    trustBadge.innerHTML = '<span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>Free Assessment · Instant Report';
    leftCol.appendChild(trustBadge);

    // Title
    const title = this.createElement('h1', 'text-4xl md:text-5xl font-bold text-white mb-4 leading-tight');
    title.textContent = intro.headline || meta.title || 'Assessment';
    leftCol.appendChild(title);

    // Subtitle
    const subtitle = this.createElement('p', 'text-slate-400 text-lg mb-6 max-w-xl');
    subtitle.textContent = intro.subheadline || meta.subtitle || '';
    leftCol.appendChild(subtitle);

    // Trust indicators
    if (intro.trustIndicators && intro.trustIndicators.length > 0) {
      const trustList = this.createElement('div', 'flex flex-wrap justify-center lg:justify-start gap-3 mb-8');
      intro.trustIndicators.forEach(indicator => {
        const item = this.createElement('span', 'inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/60 border border-slate-700/40 px-3 py-1.5 rounded-lg');
        item.innerHTML = `<svg class="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>${AssessmentUtils.escapeHtml(indicator)}`;
        trustList.appendChild(item);
      });
      leftCol.appendChild(trustList);
    }

    // Benefits
    if (intro.benefits && intro.benefits.length > 0) {
      const benefitsList = this.createElement('div', 'space-y-3 mb-8 text-left max-w-lg mx-auto lg:mx-0');
      intro.benefits.forEach(benefit => {
        const item = this.createElement('div', 'flex items-start gap-3');
        item.innerHTML = `<svg class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-slate-300 text-sm">${AssessmentUtils.escapeHtml(benefit)}</span>`;
        benefitsList.appendChild(item);
      });
      leftCol.appendChild(benefitsList);
    }

    // CTA
    const ctaWrapper = this.createElement('div', 'flex flex-col sm:flex-row gap-4 justify-center lg:justify-start');
    const cta = this.createElement('button', 'px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-lg font-semibold transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5');
    cta.textContent = intro.ctaText || 'Start Assessment';
    cta.addEventListener('click', () => this.onStart());
    ctaWrapper.appendChild(cta);
    leftCol.appendChild(ctaWrapper);

    // Privacy note
    const privacy = this.createElement('p', 'text-slate-500 text-sm mt-4');
    privacy.innerHTML = '<span class="text-emerald-400">✓</span> No email required to view results · <span class="text-emerald-400">✓</span> Confidential and secure';
    leftCol.appendChild(privacy);

    grid.appendChild(leftCol);

    // RIGHT COLUMN: Results Preview
    if (preview.enabled && preview.deliverables) {
      const rightCol = this.createElement('div', 'flex justify-center lg:justify-end');
      const previewCard = this.createElement('div', 'relative w-full max-w-md bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl');

      // Preview header
      const previewHeader = this.createElement('div', 'text-center mb-6');
      previewHeader.innerHTML = `<div class="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Sample Results Preview</div><div class="text-slate-300 text-sm">This is what you will receive</div>`;
      previewCard.appendChild(previewHeader);

      // Score ring
      const scoreContainer = this.createElement('div', 'flex justify-center mb-6');
      const sampleScore = preview.sampleScore || 68;
      const sampleLevel = preview.sampleMaturityLevel || 'Developing';
      scoreContainer.innerHTML = `
        <div class="relative w-40 h-40">
          <svg class="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#1e293b" stroke-width="10"/>
            <circle cx="80" cy="80" r="70" fill="none" stroke="#10b981" stroke-width="10" stroke-linecap="round" stroke-dasharray="440" stroke-dashoffset="${440 - (440 * sampleScore / 100)}" class="transition-all duration-1000"/>
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="text-4xl font-bold text-white">${sampleScore}</div>
            <div class="text-xs text-slate-400 mt-1">Readiness Score</div>
            <div class="text-xs text-emerald-400 font-medium mt-1">${sampleLevel}</div>
          </div>
        </div>
      `;
      previewCard.appendChild(scoreContainer);

      // Deliverables list
      const deliverablesList = this.createElement('div', 'space-y-2');
      preview.deliverables.forEach(item => {
        const row = this.createElement('div', 'flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/30 border border-slate-600/20');
        row.innerHTML = `<span class="text-lg">${item.icon}</span><div class="flex-1 min-w-0"><div class="text-sm font-medium text-white">${AssessmentUtils.escapeHtml(item.label)}</div><div class="text-xs text-slate-400 truncate">${AssessmentUtils.escapeHtml(item.description)}</div></div>`;
        deliverablesList.appendChild(row);
      });
      previewCard.appendChild(deliverablesList);

      rightCol.appendChild(previewCard);
      grid.appendChild(rightCol);
    }

    wrapper.appendChild(grid);
    this.container.appendChild(wrapper);
    this.attachKeyboardNavigation();
  }

  /**
   * Render question screen
   */
  renderQuestion(question, index, total, currentAnswer) {
    this.clear();

    const wrapper = this.createElement('div', 'assessment-question max-w-3xl mx-auto py-8 px-6');

    // Header with back button
    const header = this.createElement('div', 'flex items-center justify-between mb-6');
    header.innerHTML = `
      <button class="assessment-btn-back text-slate-400 hover:text-white flex items-center gap-2 transition-colors" ${index === 0 ? 'disabled' : ''}>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        <span>Back</span>
      </button>
      <span class="text-slate-500 text-sm">Question ${index + 1} of ${total}</span>
    `;
    const backBtn = header.querySelector('.assessment-btn-back');
    if (index > 0) {
      backBtn.addEventListener('click', () => this.onPrevious());
    }
    wrapper.appendChild(header);

    // Progress bar
    const progress = this.createElement('div', 'mb-8');
    const pct = Math.round(((index + 1) / total) * 100);
    progress.innerHTML = `
      <div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style="width: ${pct}%"></div>
      </div>
    `;
    wrapper.appendChild(progress);

    // Question card
    const card = this.createElement('div', 'bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-xl');

    // Category badge
    const category = this.config.categories.find(c => c.id === question.category);
    if (category) {
      const badge = this.createElement('span', 'inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4');
      badge.style.backgroundColor = category.colour + '1a';
      badge.style.color = category.colour;
      badge.style.border = `1px solid ${category.colour}33`;
      badge.textContent = category.name;
      card.appendChild(badge);
    }

    // Question text
    const questionText = this.createElement('h2', 'text-xl md:text-2xl font-semibold text-white mb-6 leading-relaxed');
    questionText.textContent = question.text;
    card.appendChild(questionText);

    // Help text
    if (question.helpText) {
      const help = this.createElement('p', 'text-slate-400 text-sm mb-6 flex items-start gap-2');
      help.innerHTML = `<svg class="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg><span>${AssessmentUtils.escapeHtml(question.helpText)}</span>`;
      card.appendChild(help);
    }

    // Options
    const optionsContainer = this.createElement('div', 'space-y-3 mb-6');
    optionsContainer.setAttribute('role', 'radiogroup');
    optionsContainer.setAttribute('aria-label', question.text);

    question.options.forEach((option, i) => {
      const optionId = `option-${question.id}-${i}`;
      const isSelected = currentAnswer !== undefined && option.value === currentAnswer;

      const optionEl = this.createElement('div', `assessment-option cursor-pointer rounded-xl border p-4 transition-all duration-200 ${isSelected ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-slate-700/30 border-slate-600/30 hover:border-emerald-500/30 hover:bg-slate-600/30'}`);
      optionEl.setAttribute('role', 'radio');
      optionEl.setAttribute('aria-checked', isSelected ? 'true' : 'false');
      optionEl.setAttribute('tabindex', isSelected ? '0' : '-1');
      optionEl.setAttribute('data-value', option.value);

      optionEl.innerHTML = `
        <div class="flex items-start gap-3">
          <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected ? 'border-emerald-500' : 'border-slate-500'}">
            ${isSelected ? '<div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>' : ''}
          </div>
          <div class="flex-1">
            <div class="text-white font-medium">${AssessmentUtils.escapeHtml(option.label)}</div>
            ${option.description ? `<div class="text-slate-400 text-sm mt-1">${AssessmentUtils.escapeHtml(option.description)}</div>` : ''}
          </div>
        </div>
      `;

      optionEl.addEventListener('click', () => this.onAnswer(question.id, option.value));
      optionEl.addEventListener('keydown', (e) => this.handleOptionKeydown(e, question.id, option.value));

      optionsContainer.appendChild(optionEl);
    });

    card.appendChild(optionsContainer);

    // Next button
    const nextBtn = this.createElement('button', `w-full py-3 rounded-xl font-semibold transition-all ${currentAnswer !== undefined ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`);
    nextBtn.textContent = index < total - 1 ? 'Next Question' : 'Review Answers';
    nextBtn.disabled = currentAnswer === undefined;
    nextBtn.addEventListener('click', () => this.onNext());
    card.appendChild(nextBtn);

    wrapper.appendChild(card);
    this.container.appendChild(wrapper);

    // Focus management
    if (currentAnswer !== undefined) {
      const selected = optionsContainer.querySelector('[aria-checked="true"]');
      selected?.focus();
    }

    this.attachKeyboardNavigation();
  }

  /**
   * Render review screen
   */
  renderReview() {
    this.clear();
    const answers = this.state.state.answers;
    const questions = this.config.questions;

    const wrapper = this.createElement('div', 'assessment-review max-w-3xl mx-auto py-8 px-6');

    // Header
    const header = this.createElement('div', 'text-center mb-8');
    header.innerHTML = `
      <h2 class="text-3xl font-bold text-white mb-2">Review Your Answers</h2>
      <p class="text-slate-400">You can edit any answer before submitting.</p>
    `;
    wrapper.appendChild(header);

    // Summary
    const answered = Object.keys(answers).length;
    const total = questions.length;
    const summary = this.createElement('div', 'text-center mb-6 text-emerald-400 font-medium');
    summary.textContent = `${answered} of ${total} questions answered`;
    wrapper.appendChild(summary);

    // Questions list
    const list = this.createElement('div', 'space-y-4 mb-8');

    questions.forEach((question, i) => {
      const answer = answers[question.id];
      const option = answer !== undefined ? question.options.find(o => o.value === answer) : null;
      const category = this.config.categories.find(c => c.id === question.category);

      const item = this.createElement('div', 'bg-slate-800/60 rounded-xl border border-slate-700/50 p-5');
      item.innerHTML = `
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-slate-500 text-sm">Q${i + 1}</span>
              ${category ? `<span class="px-2 py-0.5 rounded-full text-xs font-medium" style="background:${category.colour}1a;color:${category.colour};border:1px solid ${category.colour}33">${category.name}</span>` : ''}
            </div>
            <div class="text-white font-medium mb-2">${AssessmentUtils.escapeHtml(question.text)}</div>
            <div class="text-slate-400 text-sm">${option ? `<span class="text-emerald-400">${AssessmentUtils.escapeHtml(option.label)}</span>` : '<span class="text-amber-400">Not answered</span>'}</div>
          </div>
          <button class="assessment-btn-edit text-emerald-400 hover:text-emerald-300 text-sm font-medium flex-shrink-0" data-index="${i}">Edit</button>
        </div>
      `;

      item.querySelector('.assessment-btn-edit').addEventListener('click', () => this.onEditQuestion(i));
      list.appendChild(item);
    });

    wrapper.appendChild(list);

    // Submit button
    const submitBtn = this.createElement('button', 'w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-lg font-semibold transition-all shadow-xl shadow-emerald-500/20');
    submitBtn.textContent = 'Submit Assessment';
    submitBtn.addEventListener('click', () => this.onSubmit());
    wrapper.appendChild(submitBtn);

    this.container.appendChild(wrapper);
  }

  /**
   * Render lead capture form
   */
  renderLeadCapture() {
    this.clear();

    const wrapper = this.createElement('div', 'assessment-lead max-w-lg mx-auto py-8 px-6');

    // Header
    const header = this.createElement('div', 'text-center mb-8');
    header.innerHTML = `
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <h2 class="text-2xl font-bold text-white mb-2">Almost Done</h2>
      <p class="text-slate-400">Enter your details to unlock your full results, professional report, and verified certificate.</p>
    `;
    wrapper.appendChild(header);

    // Form
    const form = this.createElement('form', 'space-y-4', { novalidate: 'true' });

    // Full Name
    form.innerHTML += `
      <div>
        <label for="leadName" class="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
        <input type="text" id="leadName" name="name" required class="assessment-input w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="Your full name" autocomplete="name">
        <div class="hidden text-red-400 text-sm mt-1" id="leadNameError"></div>
      </div>
    `;

    // Email
    form.innerHTML += `
      <div>
        <label for="leadEmail" class="block text-sm font-medium text-slate-300 mb-1">Email Address *</label>
        <input type="email" id="leadEmail" name="email" required class="assessment-input w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="your@email.com" autocomplete="email">
        <div class="hidden text-red-400 text-sm mt-1" id="leadEmailError"></div>
      </div>
    `;

    // Optional fields
    form.innerHTML += `
      <div>
        <label for="leadCompany" class="block text-sm font-medium text-slate-300 mb-1">Company (optional)</label>
        <input type="text" id="leadCompany" name="company" class="assessment-input w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="Your company" autocomplete="organization">
      </div>
      <div>
        <label for="leadJobTitle" class="block text-sm font-medium text-slate-300 mb-1">Job Title (optional)</label>
        <input type="text" id="leadJobTitle" name="jobTitle" class="assessment-input w-full bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all" placeholder="Your job title" autocomplete="organization-title">
      </div>
    `;

    // Consent checkboxes
    form.innerHTML += `
      <div class="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-3">
        <div class="flex items-start gap-3">
          <input type="checkbox" id="leadConsent" name="consent" required class="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20">
          <label for="leadConsent" class="text-slate-300 text-sm leading-relaxed">
            I agree to receive my personalised assessment results and verified certificate. I have read and agree to the <a href="/privacy-policy/" target="_blank" class="text-emerald-400 hover:text-emerald-300 underline">Privacy Policy</a>. *
          </label>
        </div>
        <div class="hidden text-red-400 text-sm" id="leadConsentError"></div>
        <div class="flex items-start gap-3">
          <input type="checkbox" id="leadNewsletter" name="newsletter" class="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20">
          <label for="leadNewsletter" class="text-slate-400 text-sm leading-relaxed">
            I would like to receive Terrnix Sustainability Intelligence and product updates. (Optional)
          </label>
        </div>
      </div>
    `;

    // Submit button
    form.innerHTML += `
      <button type="submit" id="leadSubmitBtn" class="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20">
        Unlock My Results
      </button>
    `;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onLeadSubmit) {
        this.onLeadSubmit(e);
      } else {
        console.error('[Assessment] onLeadSubmit callback not set');
      }
    });
    wrapper.appendChild(form);

    // Privacy note
    const privacy = this.createElement('p', 'text-slate-500 text-xs text-center mt-4');
    privacy.innerHTML = 'Your information is secure. We never share your data with third parties.';
    wrapper.appendChild(privacy);

    this.container.appendChild(wrapper);
  }

  /**
   * Render professional results screen (Milestone 3)
   */
  renderResults(results) {
    this.clear();
    const participant = this.state.state.participant || {};
    const config = this.config;
    const meta = config.metadata || {};
    const overall = results.overall;
    const categories = Object.values(results.categories);
    const strengths = results.strengths || [];
    const gaps = results.gaps || [];
    const recommendations = this.getRecommendations(results);
    const completionDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const wrapper = this.createElement('div', 'assessment-results max-w-4xl mx-auto py-8 px-4 md:px-6');

    // Hero section
    const hero = this.createElement('div', 'text-center mb-10');
    hero.innerHTML = `
      <div class="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
        <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <h2 class="text-3xl md:text-4xl font-bold text-white mb-2">Your Assessment Results</h2>
      ${participant.name ? `<p class="text-slate-400 text-lg">Prepared for ${AssessmentUtils.escapeHtml(participant.name)}</p>` : ''}
      <p class="text-slate-500 text-sm mt-1">${meta.title || 'Carbon Accounting Readiness Assessment'} &middot; ${completionDate}</p>
    `;
    wrapper.appendChild(hero);

    // Score card
    const scoreCard = this.createElement('div', 'bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-xl');
    scoreCard.innerHTML = `
      <div class="flex flex-col md:flex-row items-center gap-8">
        <div class="text-center md:text-left flex-1">
          <div class="text-7xl font-bold text-emerald-400 mb-2">${overall.score}</div>
          <div class="text-slate-400 text-lg mb-4">out of 100</div>
          <div class="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-lg">
            ${overall.maturityLevel.label}
          </div>
        </div>
        <div class="flex-1 w-full">
          <div class="space-y-3">
            ${categories.map(cat => `
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-slate-300">${AssessmentUtils.escapeHtml(cat.name)}</span>
                  <span class="text-emerald-400 font-semibold">${cat.score}%</span>
                </div>
                <div class="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-1000" style="width: ${cat.score}%; background: ${this.getCategoryColor(cat.score)}"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    wrapper.appendChild(scoreCard);

    // Executive summary
    const summary = this.createElement('div', 'bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6 mb-8');
    summary.innerHTML = `
      <h3 class="text-xl font-semibold text-white mb-4">Executive Summary</h3>
      <p class="text-slate-300 leading-relaxed">${this.getExecutiveSummary(overall.maturityLevel.label, overall.score, categories)}</p>
    `;
    wrapper.appendChild(summary);

    // Category analysis
    const catSection = this.createElement('div', 'mb-8');
    catSection.innerHTML = `<h3 class="text-xl font-semibold text-white mb-4">Category Analysis</h3>`;
    const catGrid = this.createElement('div', 'grid grid-cols-1 md:grid-cols-2 gap-4');
    categories.forEach(cat => {
      const catCard = this.createElement('div', 'bg-slate-800/40 rounded-xl border border-slate-700/50 p-5');
      const status = this.getCategoryStatus(cat.score);
      catCard.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-semibold text-white">${AssessmentUtils.escapeHtml(cat.name)}</h4>
          <span class="px-2 py-1 rounded-full text-xs font-medium" style="background: ${status.bg}; color: ${status.color}; border: 1px solid ${status.border}">${status.label}</span>
        </div>
        <div class="text-3xl font-bold mb-2" style="color: ${status.color}">${cat.score}%</div>
        <p class="text-slate-400 text-sm">${this.getCategoryInterpretation(cat.name, cat.score)}</p>
      `;
      catGrid.appendChild(catCard);
    });
    catSection.appendChild(catGrid);
    wrapper.appendChild(catSection);

    // Strengths
    if (strengths.length > 0) {
      const strengthsSection = this.createElement('div', 'bg-emerald-500/5 rounded-2xl border border-emerald-500/20 p-6 mb-8');
      strengthsSection.innerHTML = `
        <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          Key Strengths
        </h3>
        <div class="space-y-3">
          ${strengths.map(s => `
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-emerald-400 font-bold text-sm">${s.score}%</span>
              </div>
              <div>
                <div class="text-white font-medium">${AssessmentUtils.escapeHtml(s.name)}</div>
                <div class="text-slate-400 text-sm">${AssessmentUtils.escapeHtml(s.description)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      wrapper.appendChild(strengthsSection);
    }

    // Priority gaps
    if (gaps.length > 0) {
      const gapsSection = this.createElement('div', 'bg-amber-500/5 rounded-2xl border border-amber-500/20 p-6 mb-8');
      gapsSection.innerHTML = `
        <h3 class="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          Priority Improvement Areas
        </h3>
        <div class="space-y-3">
          ${gaps.map(g => `
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span class="text-amber-400 font-bold text-sm">${g.score}%</span>
              </div>
              <div>
                <div class="text-white font-medium">${AssessmentUtils.escapeHtml(g.name)}</div>
                <div class="text-slate-400 text-sm">${AssessmentUtils.escapeHtml(g.description)}</div>
                <div class="text-amber-400 text-xs mt-1 font-medium">Risk level: ${g.risk}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      wrapper.appendChild(gapsSection);
    }

    // Action roadmaps
    const roadmap = this.createElement('div', 'mb-8');
    roadmap.innerHTML = `<h3 class="text-xl font-semibold text-white mb-4">Your Action Roadmap</h3>`;
    const roadmapGrid = this.createElement('div', 'grid grid-cols-1 md:grid-cols-3 gap-4');
    const phases = [
      { days: '30 days', label: 'Immediate Actions', actions: this.getRoadmapActions(gaps, 30) },
      { days: '60 days', label: 'Build Momentum', actions: this.getRoadmapActions(gaps, 60) },
      { days: '90 days', label: 'Embed Practice', actions: this.getRoadmapActions(gaps, 90) }
    ];
    phases.forEach(phase => {
      const phaseCard = this.createElement('div', 'bg-slate-800/40 rounded-xl border border-slate-700/50 p-5');
      phaseCard.innerHTML = `
        <div class="text-emerald-400 font-semibold text-sm mb-1">${phase.days}</div>
        <h4 class="text-white font-semibold mb-3">${phase.label}</h4>
        <ul class="space-y-2">
          ${phase.actions.map(a => `<li class="text-slate-400 text-sm flex items-start gap-2"><span class="text-emerald-500 mt-1">&bull;</span>${AssessmentUtils.escapeHtml(a)}</li>`).join('')}
        </ul>
      `;
      roadmapGrid.appendChild(phaseCard);
    });
    roadmap.appendChild(roadmapGrid);
    wrapper.appendChild(roadmap);

    // Recommendations
    if (recommendations.length > 0) {
      const recSection = this.createElement('div', 'mb-8');
      recSection.innerHTML = `<h3 class="text-xl font-semibold text-white mb-4">Recommended Resources</h3>`;
      const recGrid = this.createElement('div', 'grid grid-cols-1 md:grid-cols-2 gap-4');
      recommendations.forEach(rec => {
        const recCard = this.createElement('a', 'block bg-slate-800/40 rounded-xl border border-slate-700/50 p-5 hover:border-emerald-500/30 hover:bg-slate-700/40 transition-all', { href: rec.url, target: '_blank' });
        recCard.innerHTML = `
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <div class="text-white font-medium">${AssessmentUtils.escapeHtml(rec.title)}</div>
              <div class="text-slate-400 text-sm mt-1">${AssessmentUtils.escapeHtml(rec.description)}</div>
              <div class="text-emerald-400 text-xs mt-2 font-medium">${rec.type} &rarr;</div>
            </div>
          </div>
        `;
        recCard.addEventListener('click', () => this.onRecommendationClick?.(rec));
        recGrid.appendChild(recCard);
      });
      recSection.appendChild(recGrid);
      wrapper.appendChild(recSection);
    }

    // Download buttons
    const downloadSection = this.createElement('div', 'bg-slate-800/40 rounded-2xl border border-slate-700/50 p-6 mb-8');
    downloadSection.innerHTML = `
      <h3 class="text-xl font-semibold text-white mb-4">Download Your Documents</h3>
      <div class="flex flex-col sm:flex-row gap-4">
        <button id="btnDownloadReport" class="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Download Full Report (PDF)
        </button>
        <button id="btnDownloadCertificate" class="flex-1 py-4 px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all flex items-center justify-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.587 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.587 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.587 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.587 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
          Download Certificate (PDF)
        </button>
      </div>
    `;
    wrapper.appendChild(downloadSection);

    // Consultation CTA
    const cta = this.createElement('div', 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl border border-emerald-500/20 p-6 text-center');
    cta.innerHTML = `
      <h3 class="text-xl font-semibold text-white mb-2">Need Expert Guidance?</h3>
      <p class="text-slate-400 mb-4">Speak with a Terrnix carbon accounting specialist about your results and next steps.</p>
      <a href="/contact/?source=assessment-results" class="inline-block px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20">
        Book a Free Consultation
      </a>
    `;
    wrapper.appendChild(cta);

    // Disclaimer
    const disclaimer = this.createElement('div', 'mt-8 text-center');
    disclaimer.innerHTML = `
      <p class="text-slate-500 text-xs">This assessment provides a diagnostic view of your carbon accounting readiness based on your responses. It is not a professional audit, regulatory certification, or substitute for independent assurance.</p>
    `;
    wrapper.appendChild(disclaimer);

    this.container.appendChild(wrapper);

    // Attach download handlers
    const reportBtn = document.getElementById('btnDownloadReport');
    const certBtn = document.getElementById('btnDownloadCertificate');
    if (reportBtn) reportBtn.addEventListener('click', () => this.onDownloadReport?.());
    if (certBtn) certBtn.addEventListener('click', () => this.onDownloadCertificate?.());
  }

  /**
   * Get category color based on score
   */
  getCategoryColor(score) {
    if (score >= 70) return '#34d399';
    if (score >= 50) return '#2dd4bf';
    if (score >= 30) return '#fbbf24';
    return '#f87171';
  }

  /**
   * Get category status label and colors
   */
  getCategoryStatus(score) {
    if (score >= 70) return { label: 'Strong', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.3)' };
    if (score >= 50) return { label: 'Good', color: '#2dd4bf', bg: 'rgba(45,212,191,0.1)', border: 'rgba(45,212,191,0.3)' };
    if (score >= 30) return { label: 'Developing', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)' };
    return { label: 'Priority', color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)' };
  }

  /**
   * Generate executive summary text
   * Creates personalised, specific summary based on actual category scores
   */
  getExecutiveSummary(maturityLabel, score, categories) {
    const sortedCats = [...categories].sort((a, b) => b.score - a.score);
    const highest = sortedCats[0];
    const lowest = sortedCats[sortedCats.length - 1];
    const scoreGap = highest.score - lowest.score;
    
    // Check if all scores are identical (common when testing with same answers)
    const allEqual = sortedCats.every(c => c.score === sortedCats[0].score);
    
    // Build category-specific insight
    let categoryInsight = '';
    if (allEqual) {
      categoryInsight = `All five dimensions scored equally at ${highest.score}%, indicating consistent practice across governance, methodology, data quality, Scope 3, and reporting. This suggests your organisation has taken a balanced approach to carbon accounting implementation.`;
    } else if (scoreGap <= 15) {
      categoryInsight = `Your scores are relatively balanced across dimensions (gap of ${scoreGap}%), with ${highest.name} (${highest.score}%) leading and ${lowest.name} (${lowest.score}%) as the focus area. This indicates broad organisational engagement with carbon accounting.`;
    } else {
      categoryInsight = `${highest.name} (${highest.score}%) is your clear strength, while ${lowest.name} (${lowest.score}%) represents the largest improvement opportunity. Closing this ${scoreGap}-point gap should be your priority.`;
    }

    const summaries = {
      'Initial': `Your organisation is at an early stage of carbon accounting maturity, with a score of ${score}%. ${categoryInsight} Significant gaps remain across most dimensions. Begin with quick wins: assign ownership, document boundaries, and establish basic data collection. Early investment in governance will accelerate all other areas.`,
      'Developing': `Your organisation shows emerging carbon accounting capability, scoring ${score}%. ${categoryInsight} Some processes are in place but consistency and coverage remain limited. Focus on standardising existing practices, expanding scope coverage, and building internal capability before pursuing external commitments.`,
      'Established': `Your organisation has achieved a solid foundation in carbon accounting with a score of ${score}%. ${categoryInsight} Core processes are documented and operational. The next phase involves deepening integration: linking carbon performance to financial planning, expanding supplier engagement programmes, and preparing for external assurance or science-based target validation.`,
      'Advanced': `Your organisation demonstrates advanced carbon accounting maturity at ${score}%. ${categoryInsight} Processes are well-integrated, data quality is strong, and reporting is consistent. Focus on leadership activities: supplier development programmes, sector collaboration, and preparing for evolving regulatory requirements such as CSRD or CBAM.`,
      'Leading': `Your organisation operates at leading practice level with a score of ${score}%. ${categoryInsight} Carbon accounting is deeply embedded in governance, operations, and strategy. Maintain this standard while extending influence: support supplier decarbonisation, contribute to industry methodology development, and prepare for emerging regulatory frameworks.`
    };

    return summaries[maturityLabel] || summaries['Established'];
  }

  /**
   * Generate category interpretation with specific, actionable insights
   */
  getCategoryInterpretation(categoryName, score) {
    const interpretations = {
      'Governance and Accountability': {
        low: 'Leadership engagement and accountability structures need significant development. Carbon responsibility is likely fragmented or absent from executive oversight.',
        mid: 'Governance exists but lacks consistency and board-level integration. Carbon performance may be reported annually without driving decisions.',
        high: 'Strong governance with clear accountability and executive oversight. Carbon is embedded in risk management and strategic planning.'
      },
      'Organisational Boundaries and Methodology': {
        low: 'Boundaries and methodology are undefined or inconsistently applied. This undermines data comparability and audit readiness.',
        mid: 'Basic methodology exists but needs regular review and broader scope coverage. Changes in operations may not trigger recalculation.',
        high: 'Well-defined boundaries with robust, regularly reviewed methodology. Changes are documented and baseline years are maintained.'
      },
      'Emissions Data and Calculation Quality': {
        low: 'Data collection is ad hoc with significant quality gaps. Sources may be incomplete and emission factors outdated.',
        mid: 'Structured data collection exists but uncertainty management needs work. Some categories may rely on estimates rather than measured data.',
        high: 'High-quality data with strong verification and uncertainty management. Activity data is complete and factors are current.'
      },
      'Scope 3 and Supplier Engagement': {
        low: 'Limited Scope 3 screening and minimal supplier engagement. Upstream and downstream emissions are largely unquantified.',
        mid: 'Most categories screened but supplier data collection remains challenging. Spend-based estimates may dominate over activity data.',
        high: 'Comprehensive Scope 3 tracking with structured supplier programmes. Category-specific approaches are tailored to data availability.'
      },
      'Reporting, Targets and Improvement': {
        low: 'Limited disclosure and no formal targets or improvement processes. Carbon information may not reach external stakeholders.',
        mid: 'Basic reporting and targets exist but lack integration and ambition. Targets may not be science-based or regularly reviewed.',
        high: 'Integrated reporting with science-based targets and continuous improvement. Progress is tracked quarterly and reported transparently.'
      }
    };

    const catInterp = interpretations[categoryName] || interpretations['Governance and Accountability'];
    if (score < 40) return catInterp.low;
    if (score < 70) return catInterp.mid;
    return catInterp.high;
  }

  /**
   * Generate roadmap actions based on gaps
   */
  getRoadmapActions(gaps, phase) {
    const allActions = {
      'Governance and Accountability': [
        'Assign a dedicated carbon accounting lead with clear mandate',
        'Establish a cross-functional sustainability committee',
        'Integrate carbon performance into board reporting',
        'Develop carbon accounting policy and procedures',
        'Create executive dashboard for carbon metrics'
      ],
      'Organisational Boundaries and Methodology': [
        'Document organisational boundary approach',
        'Approve emissions calculation methodology',
        'Expand scope coverage to all material categories',
        'Establish emission factor review schedule',
        'Implement baseline year and recalculation policy'
      ],
      'Emissions Data and Calculation Quality': [
        'Map all data sources and assign owners',
        'Implement data quality checks and validation',
        'Assess uncertainty for key categories',
        'Complete Scope 1 and 2 data collection',
        'Arrange internal or external verification'
      ],
      'Scope 3 and Supplier Engagement': [
        'Screen all Scope 3 categories',
        'Identify material categories for prioritisation',
        'Launch supplier data collection programme',
        'Implement hybrid calculation methods',
        'Set Scope 3 reduction targets'
      ],
      'Reporting, Targets and Improvement': [
        'Publish first emissions disclosure',
        'Set formal reduction targets with timeline',
        'Integrate carbon into ESG reporting',
        'Align targets with SBTi or science-based criteria',
        'Establish quarterly review and improvement cycle'
      ]
    };

    const actions = [];
    const gapNames = gaps.map(g => g.name);

    // Add actions from lowest-scoring categories first
    gapNames.forEach(name => {
      const catActions = allActions[name] || [];
      if (phase === 30) actions.push(...catActions.slice(0, 2));
      else if (phase === 60) actions.push(...catActions.slice(2, 4));
      else actions.push(...catActions.slice(4));
    });

    // Deduplicate and limit
    const unique = [...new Set(actions)];
    return unique.slice(0, phase === 30 ? 4 : phase === 60 ? 3 : 2);
  }

  /**
   * Get recommendations from config based on results
   */
  getRecommendations(results) {
    const configRecs = this.config.recommendations || {};
    const score = results.overall.score;
    const categoryScores = results.categories;

    // Flatten all recommendation types into a single array
    const allRecs = [];
    ['articles', 'calculators', 'guides', 'glossary', 'faq', 'services'].forEach(type => {
      const items = configRecs[type] || [];
      items.forEach(item => {
        allRecs.push({ ...item, type: type === 'articles' ? 'Article' : type === 'calculators' ? 'Calculator' : type === 'guides' ? 'Guide' : type === 'glossary' ? 'Glossary' : type === 'faq' ? 'FAQ' : 'Service' });
      });
    });

    // Sort categories by score (lowest first)
    const sortedCats = Object.values(categoryScores).sort((a, b) => a.score - b.score);
    const lowestCats = sortedCats.slice(0, 2).map(c => c.id);

    return allRecs.filter(rec => {
      // Category match: recommend if any of the rec's categories are in the lowest 2
      if (rec.categories && rec.categories.some(cat => lowestCats.includes(cat))) return true;
      // Or if no categories specified, include it
      if (!rec.categories || rec.categories.length === 0) return true;
      return false;
    }).slice(0, 4);
  }

  /**
   * Event callbacks (to be set by AssessmentEngine)
   */
  onStart() {}
  onPrevious() {}
  onNext() {}
  onAnswer(questionId, value) {}
  onEditQuestion(index) {}
  onSubmit() {}
  onLeadSubmit(e) {}
  onDownloadReport() {}
  onDownloadCertificate() {}
  onRecommendationClick(rec) {}

  /**
   * Render loading state
   */
  renderLoading(message = 'Loading...') {
    this.clear();
    const wrapper = this.createElement('div', 'flex items-center justify-center py-20');
    wrapper.innerHTML = `
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-slate-400">${AssessmentUtils.escapeHtml(message)}</p>
      </div>
    `;
    this.container.appendChild(wrapper);
  }

  /**
   * Render error state
   */
  renderError(message) {
    this.clear();
    const wrapper = this.createElement('div', 'max-w-lg mx-auto py-12 px-6 text-center');
    wrapper.innerHTML = `
      <div class="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <h2 class="text-xl font-bold text-white mb-2">Something went wrong</h2>
      <p class="text-slate-400 mb-6">${AssessmentUtils.escapeHtml(message)}</p>
      <button class="px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors" onclick="location.reload()">Try Again</button>
    `;
    this.container.appendChild(wrapper);
  }

  /**
   * Keyboard navigation handler
   */
  attachKeyboardNavigation() {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }

    this.keyboardHandler = (e) => {
      const screen = this.state.state.ui.screen;

      if (screen === 'question') {
        this.handleQuestionKeyboard(e);
      }
    };

    document.addEventListener('keydown', this.keyboardHandler);
  }

  handleQuestionKeyboard(e) {
    const options = this.container.querySelectorAll('[role="radio"]');
    const currentIndex = Array.from(options).findIndex(o => o.getAttribute('tabindex') === '0');

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < options.length - 1) {
          options[currentIndex + 1].focus();
        }
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          options[currentIndex - 1].focus();
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const focused = document.activeElement;
        if (focused?.getAttribute('role') === 'radio') {
          const value = focused.getAttribute('data-value');
          const questionId = this.state.getCurrentQuestion()?.id;
          if (questionId && value) {
            this.onAnswer(questionId, parseInt(value));
          }
        }
        break;
    }
  }

  handleOptionKeydown(e, questionId, value) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.onAnswer(questionId, value);
    }
  }

  /**
   * Event callbacks (to be set by AssessmentEngine)
   */
  onStart() {}
  onPrevious() {}
  onNext() {}
  onAnswer(questionId, value) {}
  onEditQuestion(index) {}
  onSubmit() {}
  onLeadSubmit(e) {}

  /**
   * Destroy UI
   */
  destroy() {
    if (this.keyboardHandler) {
      document.removeEventListener('keydown', this.keyboardHandler);
    }
    this.clear();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AssessmentUI;
}
