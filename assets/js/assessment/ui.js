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

    const wrapper = this.createElement('div', 'assessment-intro max-w-3xl mx-auto text-center py-12 px-6');

    // Icon
    const iconWrapper = this.createElement('div', 'w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20');
    iconWrapper.innerHTML = '<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
    wrapper.appendChild(iconWrapper);

    // Title
    const title = this.createElement('h1', 'text-4xl md:text-5xl font-bold text-white mb-4');
    title.textContent = intro.headline || meta.title || 'Assessment';
    wrapper.appendChild(title);

    // Subtitle
    const subtitle = this.createElement('p', 'text-slate-400 text-lg mb-8 max-w-2xl mx-auto');
    subtitle.textContent = intro.subheadline || meta.subtitle || '';
    wrapper.appendChild(subtitle);

    // Meta info
    const metaRow = this.createElement('div', 'flex justify-center gap-6 mb-10 text-slate-500');
    metaRow.innerHTML = `
      <div class="flex items-center gap-2"><span class="text-emerald-400 font-semibold">${this.config.questions?.length || 0}</span> questions</div>
      <div class="flex items-center gap-2"><span class="text-emerald-400 font-semibold">${meta.estimatedDuration || '10 min'}</span></div>
      <div class="flex items-center gap-2"><span class="text-emerald-400 font-semibold">${this.config.categories?.length || 0}</span> categories</div>
    `;
    wrapper.appendChild(metaRow);

    // Benefits
    if (intro.benefits && intro.benefits.length > 0) {
      const benefitsList = this.createElement('div', 'grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left max-w-xl mx-auto');
      intro.benefits.forEach(benefit => {
        const item = this.createElement('div', 'flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30');
        item.innerHTML = `<svg class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-slate-300 text-sm">${AssessmentUtils.escapeHtml(benefit)}</span>`;
        benefitsList.appendChild(item);
      });
      wrapper.appendChild(benefitsList);
    }

    // CTA
    const cta = this.createElement('button', 'px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-lg font-semibold transition-all shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5');
    cta.textContent = intro.ctaText || 'Start Assessment';
    cta.addEventListener('click', () => this.onStart());
    wrapper.appendChild(cta);

    // Privacy note
    const privacy = this.createElement('p', 'text-slate-500 text-sm mt-6');
    privacy.innerHTML = 'Your responses are confidential and used only to generate your personalised results.';
    wrapper.appendChild(privacy);

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

    form.addEventListener('submit', (e) => this.onLeadSubmit(e));
    wrapper.appendChild(form);

    // Privacy note
    const privacy = this.createElement('p', 'text-slate-500 text-xs text-center mt-4');
    privacy.innerHTML = 'Your information is secure. We never share your data with third parties.';
    wrapper.appendChild(privacy);

    this.container.appendChild(wrapper);
  }

  /**
   * Render results screen (placeholder for Milestone 3)
   */
  renderResults(results) {
    this.clear();

    const wrapper = this.createElement('div', 'assessment-results max-w-3xl mx-auto py-8 px-6 text-center');

    wrapper.innerHTML = `
      <div class="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <h2 class="text-3xl font-bold text-white mb-2">Assessment Complete</h2>
      <p class="text-slate-400 mb-8">Your results are being prepared.</p>
      <div class="text-6xl font-bold text-emerald-400 mb-2">${results.overall.score}</div>
      <div class="text-slate-400 mb-8">out of 100</div>
      <div class="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
        ${results.overall.maturityLevel.label}
      </div>
    `;

    this.container.appendChild(wrapper);
  }

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
