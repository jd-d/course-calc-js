export function initCalculator() {
  const breakdownDialog = document.getElementById('lesson-breakdown-dialog');
  const breakdownBackdrop = document.getElementById('lesson-breakdown-backdrop');
  const breakdownClose = document.getElementById('lesson-breakdown-close');
  const breakdownSummary = document.getElementById('lesson-breakdown-summary');
  const breakdownVariant = document.getElementById('lesson-breakdown-variant');
  const breakdownPrice = document.getElementById('lesson-breakdown-price');
  const breakdownMeta = document.getElementById('lesson-breakdown-meta');
  const breakdownTotal = document.getElementById('lesson-breakdown-total');
  const breakdownTableBody = document.getElementById('lesson-breakdown-table-body');
  const breakdownChartGraphic = document.getElementById('lesson-breakdown-chart-graphic');
  const breakdownLegend = document.getElementById('lesson-breakdown-legend');
  const howToLink = document.getElementById('how-to-link');
  const readmeDialog = document.getElementById('readme-dialog');
  const readmeBody = document.getElementById('readme-body');
  const readmeClose = document.getElementById('readme-close');
  const readmeBackdrop = document.getElementById('readme-backdrop');
  const accountingDialog = document.getElementById('accounting-dialog');
  const accountingBackdrop = document.getElementById('accounting-backdrop');
  const accountingClose = document.getElementById('accounting-close');
  const accountingForm = document.getElementById('accounting-form');
  const accountingStudentsInput = document.getElementById('accounting-students');
  const accountingClassesInput = document.getElementById('accounting-classes');
  const accountingHoursInput = document.getElementById('accounting-hours');
  const accountingError = document.getElementById('accounting-error');
  const accountingCancel = document.getElementById('accounting-cancel');
  let readmeLoaded = false;
  let readmeLoading = false;
  let previouslyFocusedElement = null;
  let breakdownTriggerElement = null;
  let activeBreakdownContext = null;
  let accountingTriggerElement = null;
  
  const controls = {
    targetNet: document.getElementById('target-net'),
    targetNetWeek: document.getElementById('target-net-week'),
    targetNetMonth: document.getElementById('target-net-month'),
    targetNetAverageWeek: document.getElementById('target-net-average-week'),
    targetNetAverageMonth: document.getElementById('target-net-average-month'),
    desiredIncomeToggleDisplay: document.getElementById('desired-income-toggle-display'),
    desiredIncomeToggleInterpretation: document.getElementById('desired-income-toggle-interpretation'),
    acceptableIncomeMin: document.getElementById('acceptable-income-min'),
    acceptableIncomeMax: document.getElementById('acceptable-income-max'),
    acceptableIncomeBasisMonthly: document.getElementById('acceptable-income-basis-monthly'),
    acceptableIncomeBasisAnnual: document.getElementById('acceptable-income-basis-annual'),
    taxRate: document.getElementById('tax-rate'),
    fixedCosts: document.getElementById('fixed-costs'),
    variableCostPerClass: document.getElementById('variable-cost-class'),
    variableCostPerStudent: document.getElementById('variable-cost-student'),
    variableCostPerStudentMonthly: document.getElementById('variable-cost-student-monthly'),
    vatRate: document.getElementById('vat-rate'),
    classesPerWeek: document.getElementById('classes-per-week'),
    studentsPerClass: document.getElementById('students-per-class'),
    hoursPerLesson: document.getElementById('hours-per-lesson'),
    lessonCost: document.getElementById('lesson-cost'),
    lessonPriceMin: document.getElementById('lesson-price-min'),
    lessonPriceMax: document.getElementById('lesson-price-max'),
    monthsOff: document.getElementById('months-off'),
    weeksOffCycle: document.getElementById('weeks-off-cycle'),
    daysOffWeek: document.getElementById('days-off-week'),
    buffer: document.getElementById('buffer'),
    currencySymbol: document.getElementById('currency-symbol'),
    recalcButton: document.getElementById('recalculate'),
    downloadCsv: document.getElementById('download-csv'),
    accountingExample: document.getElementById('open-accounting-example'),
    statusMessage: document.getElementById('status-message'),
    workingWeeksDisplay: document.getElementById('working-weeks-display'),
    workingDaysDisplay: document.getElementById('working-days-display'),
    rememberInputs: document.getElementById('remember-inputs'),
    resetSavedInputs: document.getElementById('reset-saved-inputs')
  };
  
  const desiredIncomeFieldMap = {
    year: controls.targetNet,
    week: controls.targetNetWeek,
    month: controls.targetNetMonth,
    avgWeek: controls.targetNetAverageWeek,
    avgMonth: controls.targetNetAverageMonth
  };
  
  const COLLAPSIBLE_SECTION_SELECTOR = '.control-section[data-collapsible]';
  
  function getSectionLabel(section, index = 0) {
    if (!section) {
      return `Section ${index + 1}`;
    }
  
    const title = section.querySelector('.section-title');
    const labelText = title && title.textContent ? title.textContent.trim() : '';
  
    if (labelText) {
      section.dataset.sectionLabel = labelText;
      return labelText;
    }
  
    if (section.dataset.sectionLabel) {
      return section.dataset.sectionLabel;
    }
  
    const fallback = `Section ${index + 1}`;
    section.dataset.sectionLabel = fallback;
    return fallback;
  }
  
  function updateToggleButtonState(toggle, collapsed, sectionLabel) {
    if (!toggle) {
      return;
    }
  
    const expandedText = toggle.getAttribute('data-expanded-text') || 'Collapse section';
    const collapsedText = toggle.getAttribute('data-collapsed-text') || 'Expand section';
    const labelElement = toggle.querySelector('.toggle-label');
    const nextText = collapsed ? collapsedText : expandedText;
  
    if (labelElement) {
      labelElement.textContent = nextText;
    } else {
      toggle.textContent = nextText;
    }
  
    const actionText = collapsed ? collapsedText : expandedText;
    const normalizedAction = actionText.replace(/\s+section$/i, '');
    const normalizedLabel = sectionLabel || 'section';
  
    toggle.setAttribute('aria-expanded', String(!collapsed));
    toggle.setAttribute('aria-label', `${normalizedAction} ${normalizedLabel} section`);
    toggle.setAttribute('title', `${normalizedAction} ${normalizedLabel} section`);
  }
  
  const collapsibleSections = new Map();
  
  function registerCollapsibleSection(section) {
    if (!(section instanceof HTMLElement)) {
      return;
    }
  
    const body = section.querySelector('.section-body');
    if (!(body instanceof HTMLElement)) {
      return;
    }
  
    const existing = collapsibleSections.get(section);
    const listeners = existing ? existing.listeners : new Map();
    const collapsed = section.classList.contains('collapsed');
    const fallbackIndex = collapsibleSections.size;
    const sectionLabel = getSectionLabel(section, fallbackIndex);
    section.dataset.sectionLabel = sectionLabel;
  
    if (!body.id) {
      const baseId = sectionLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `section-${fallbackIndex + 1}`;
  
      let uniqueId = baseId;
      let attempt = 1;
      while (document.getElementById(uniqueId)) {
        attempt += 1;
        uniqueId = `${baseId}-${attempt}`;
      }
  
      body.id = uniqueId;
    }
  
    const seenToggles = new Set();
    section.querySelectorAll('.section-toggle').forEach(toggle => {
      if (!(toggle instanceof HTMLElement)) {
        return;
      }
  
      seenToggles.add(toggle);
  
      if (!listeners.has(toggle)) {
        const handler = event => {
          event.preventDefault();
          toggleCollapsibleSection(section, { trigger: toggle });
        };
        toggle.addEventListener('click', handler);
        listeners.set(toggle, handler);
      }
  
      toggle.setAttribute('aria-controls', body.id);
      updateToggleButtonState(toggle, collapsed, sectionLabel);
    });
  
    if (existing) {
      for (const [toggle, handler] of listeners) {
        if (!seenToggles.has(toggle)) {
          toggle.removeEventListener('click', handler);
          listeners.delete(toggle);
        }
      }
    }
  
    collapsibleSections.set(section, { body, listeners });
  }
  
  function unregisterCollapsibleSection(section) {
    const data = collapsibleSections.get(section);
    if (!data) {
      return;
    }
  
    for (const [toggle, handler] of data.listeners) {
      toggle.removeEventListener('click', handler);
    }
  
    collapsibleSections.delete(section);
  }
  
  function captureCollapsibleSectionStates() {
    const states = {};
    document.querySelectorAll(COLLAPSIBLE_SECTION_SELECTOR).forEach(section => {
      if (!(section instanceof HTMLElement)) {
        return;
      }
      const body = section.querySelector('.section-body');
      const key = body instanceof HTMLElement ? body.id : '';
      if (!key) {
        return;
      }
      states[key] = section.classList.contains('collapsed');
    });
    return states;
  }
  
  function applyCollapsibleSectionStates(states, { skipPersistence = false } = {}) {
    if (!states || typeof states !== 'object') {
      return;
    }
    document.querySelectorAll(COLLAPSIBLE_SECTION_SELECTOR).forEach(section => {
      if (!(section instanceof HTMLElement)) {
        return;
      }
      const body = section.querySelector('.section-body');
      const key = body instanceof HTMLElement ? body.id : '';
      if (!key || !Object.prototype.hasOwnProperty.call(states, key)) {
        return;
      }
      toggleCollapsibleSection(section, {
        explicitState: Boolean(states[key]),
        skipPersistence: skipPersistence === true
      });
    });
  }
  
  function toggleCollapsibleSection(section, { trigger, explicitState, skipPersistence = false } = {}) {
    if (!(section instanceof HTMLElement)) {
      return;
    }
  
    if (!collapsibleSections.has(section)) {
      registerCollapsibleSection(section);
    }
  
    const data = collapsibleSections.get(section);
    if (!data) {
      return;
    }
  
    const isCollapsed = section.classList.contains('collapsed');
    const nextCollapsed = typeof explicitState === 'boolean' ? explicitState : !isCollapsed;
  
    if (nextCollapsed === isCollapsed) {
      const scroll = () => {
        if (typeof section.scrollIntoView === 'function') {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
  
      if (typeof requestAnimationFrame === 'function') {
        requestAnimationFrame(scroll);
      } else {
        scroll();
      }
      return;
    }
  
    section.classList.toggle('collapsed', nextCollapsed);
    const sectionLabel = getSectionLabel(section, 0);
    section.dataset.sectionLabel = sectionLabel;
  
    for (const toggle of data.listeners.keys()) {
      updateToggleButtonState(toggle, nextCollapsed, sectionLabel);
    }
  
    if (nextCollapsed && trigger && trigger.classList.contains('section-toggle--bottom')) {
      const topToggle = section.querySelector('.section-toggle--top');
      if (topToggle && typeof topToggle.focus === 'function') {
        try {
          topToggle.focus({ preventScroll: true });
        } catch (error) {
          topToggle.focus();
        }
      }
    }
  
    const scroll = () => {
      if (typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
  
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(scroll);
    } else {
      scroll();
    }
  
    if (!skipPersistence && persistenceEnabled) {
      savePersistedInputs();
    }
  }
  
  function refreshCollapsibleSections(root = document) {
    Array.from(root.querySelectorAll(COLLAPSIBLE_SECTION_SELECTOR)).forEach(section => {
      registerCollapsibleSection(section);
    });
  }
  
  refreshCollapsibleSections(document);
  
  if (typeof MutationObserver === 'function') {
    const observerTarget = document.body || document.documentElement;
    if (observerTarget) {
      const collapsibleObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
          mutation.addedNodes?.forEach(node => {
            if (!(node instanceof HTMLElement)) {
              return;
            }
  
            if (node.matches && node.matches(COLLAPSIBLE_SECTION_SELECTOR)) {
              registerCollapsibleSection(node);
            }
  
            if (typeof node.querySelectorAll === 'function') {
              node.querySelectorAll(COLLAPSIBLE_SECTION_SELECTOR).forEach(childSection => {
                registerCollapsibleSection(childSection);
              });
            }
          });
  
          mutation.removedNodes?.forEach(node => {
            if (!(node instanceof HTMLElement)) {
              return;
            }
  
            if (collapsibleSections.has(node)) {
              unregisterCollapsibleSection(node);
            }
  
            if (typeof node.querySelectorAll === 'function') {
              node.querySelectorAll(COLLAPSIBLE_SECTION_SELECTOR).forEach(childSection => {
                unregisterCollapsibleSection(childSection);
              });
            }
          });
        }
      });
  
      collapsibleObserver.observe(observerTarget, { childList: true, subtree: true });
    }
  }
  
  function getFocusableElements(container) {
    if (!container) {
      return [];
    }
  
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
  
    return Array.from(container.querySelectorAll(selectors)).filter(element => {
      if (element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') {
        return false;
      }
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  }
  
  const activeDialogLocks = new Set();
  
  function setBodyScrollLock(source, locked) {
    if (!source) {
      return;
    }
  
    if (locked) {
      activeDialogLocks.add(source);
    } else {
      activeDialogLocks.delete(source);
    }
  
    if (activeDialogLocks.size > 0) {
      document.body.classList.add('dialog-open');
    } else {
      document.body.classList.remove('dialog-open');
    }
  }
  
  function parseMarkdown(text) {
    if (window.marked && typeof window.marked.parse === 'function') {
      return window.marked.parse(text);
    }
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<pre>${escaped}</pre>`;
  }
  
  const README_SOURCES = [
    new URL('README.md', document.baseURI).toString(),
    'https://raw.githubusercontent.com/jd-d/course-pricing-calculator/main/README.md'
  ];
  
  function fetchReadmeFromSources(sources, index = 0) {
    if (!Array.isArray(sources) || index >= sources.length) {
      return Promise.reject(new Error('No README sources available'));
    }
  
    const source = sources[index];
  
    return fetch(source)
      .then(response => {
        if (!response || !response.ok) {
          throw new Error(`Failed to load README from ${source} (status ${response ? response.status : 'unknown'})`);
        }
        return response.text();
      })
      .catch(error => {
        if (index < sources.length - 1) {
          if (console && typeof console.warn === 'function') {
            console.warn(error);
          }
  
          if (readmeBody) {
            readmeBody.innerHTML = '<p class="readme-status">Retrying with a backup instructions source…</p>';
          }
  
          return fetchReadmeFromSources(sources, index + 1);
        }
  
        throw error;
      });
  }
  
  function loadReadme() {
    if (readmeLoaded || readmeLoading || !readmeBody) {
      return;
    }
  
    readmeLoading = true;
  
    fetchReadmeFromSources(README_SOURCES)
      .then(text => {
        readmeBody.innerHTML = parseMarkdown(text);
        readmeLoaded = true;
      })
      .catch(() => {
        readmeBody.innerHTML = '<p class="readme-status readme-status--error">Unable to load instructions. Please check the README file directly.</p>';
      })
      .finally(() => {
        readmeLoading = false;
      });
  }
  
  function openReadme(event) {
    if (event) {
      event.preventDefault();
    }
  
    if (!readmeDialog || !readmeBody) {
      return;
    }
  
    previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    readmeDialog.hidden = false;
    setBodyScrollLock('readme', true);
  
    if (!readmeLoaded) {
      readmeBody.innerHTML = '<p class="readme-status">Loading instructions…</p>';
      loadReadme();
    }
  
    window.requestAnimationFrame(() => {
      if (readmeClose) {
        readmeClose.focus();
      }
    });
  
    document.addEventListener('keydown', handleReadmeKeydown);
  }
  
  function closeReadme() {
    if (!readmeDialog) {
      return;
    }
  
    readmeDialog.hidden = true;
    setBodyScrollLock('readme', false);
    document.removeEventListener('keydown', handleReadmeKeydown);
  
    if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
      previouslyFocusedElement.focus();
    }
  }
  
  function handleReadmeKeydown(event) {
    if (event.key === 'Escape') {
      closeReadme();
      return;
    }
  
    if (event.key === 'Tab' && readmeDialog && !readmeDialog.hidden) {
      const focusable = getFocusableElements(readmeDialog);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
  
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
  
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    }
  }
  
  function openAccountingDialog(event) {
    if (event) {
      event.preventDefault();
    }
  
    if (!accountingDialog) {
      return;
    }
  
    if (!latestInputsSnapshot) {
      const snapshotInputs = getInputs();
      latestInputsSnapshot = cloneInputs(snapshotInputs);
    }
  
    accountingTriggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  
    const snapshot = latestInputsSnapshot || {};
    const setFieldValue = (input, value, digits = 2) => {
      if (!(input instanceof HTMLInputElement)) {
        return;
      }
      if (Number.isFinite(value)) {
        input.value = formatFixed(value, digits);
      } else if (typeof input.value !== 'string' || input.value.trim() === '') {
        input.value = '';
      }
    };
  
    const defaultStudents = Array.isArray(snapshot.studentsPerClass) && snapshot.studentsPerClass.length
      ? snapshot.studentsPerClass[0]
      : null;
    const defaultClasses = Array.isArray(snapshot.classesPerWeek) && snapshot.classesPerWeek.length
      ? snapshot.classesPerWeek[0]
      : null;
    const defaultHours = Number.isFinite(snapshot.hoursPerLesson) ? snapshot.hoursPerLesson : null;
  
    setFieldValue(accountingStudentsInput, defaultStudents, 0);
    setFieldValue(accountingClassesInput, defaultClasses, 2);
    setFieldValue(accountingHoursInput, defaultHours, 2);
  
    if (accountingError) {
      accountingError.textContent = '';
    }
  
    accountingDialog.hidden = false;
    setBodyScrollLock('accounting', true);
  
    window.requestAnimationFrame(() => {
      if (accountingStudentsInput instanceof HTMLInputElement) {
        accountingStudentsInput.focus();
        accountingStudentsInput.select();
      }
    });
  
    document.addEventListener('keydown', handleAccountingKeydown);
  }
  
  function closeAccountingDialog() {
    if (!accountingDialog) {
      return;
    }
  
    accountingDialog.hidden = true;
    setBodyScrollLock('accounting', false);
    document.removeEventListener('keydown', handleAccountingKeydown);
  
    if (accountingError) {
      accountingError.textContent = '';
    }
  
    const trigger = accountingTriggerElement;
    accountingTriggerElement = null;
    if (trigger && typeof trigger.focus === 'function') {
      trigger.focus();
    }
  }
  
  function handleAccountingKeydown(event) {
    if (event.key === 'Escape') {
      closeAccountingDialog();
      return;
    }
  
    if (event.key === 'Tab' && accountingDialog && !accountingDialog.hidden) {
      const focusable = getFocusableElements(accountingDialog);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
  
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
  
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    }
  }
  
  function handleAccountingSubmit(event) {
    event.preventDefault();
  
    const studentsValue = Number(accountingStudentsInput?.value);
    if (!Number.isFinite(studentsValue) || studentsValue <= 0) {
      if (accountingError) {
        accountingError.textContent = 'Enter a positive number of students per class.';
      }
      if (accountingStudentsInput instanceof HTMLInputElement) {
        accountingStudentsInput.focus();
        accountingStudentsInput.select();
      }
      return;
    }
  
    const classesPerWeekValue = Number(accountingClassesInput?.value);
    if (!Number.isFinite(classesPerWeekValue) || classesPerWeekValue <= 0) {
      if (accountingError) {
        accountingError.textContent = 'Enter how many classes you plan to run each week (must be greater than 0).';
      }
      if (accountingClassesInput instanceof HTMLInputElement) {
        accountingClassesInput.focus();
        accountingClassesInput.select();
      }
      return;
    }
  
    const hoursPerClassValue = Number(accountingHoursInput?.value);
    if (!Number.isFinite(hoursPerClassValue) || hoursPerClassValue <= 0) {
      if (accountingError) {
        accountingError.textContent = 'Enter how long each class lasts in hours (must be greater than 0).';
      }
      if (accountingHoursInput instanceof HTMLInputElement) {
        accountingHoursInput.focus();
        accountingHoursInput.select();
      }
      return;
    }
  
    if (!Array.isArray(latestPricingData) || !latestPricingData.length) {
      if (accountingError) {
        accountingError.textContent = 'Generate the pricing table first by adding class and student values, then press Recalculate.';
      }
      return;
    }
  
    if (!latestInputsSnapshot) {
      latestInputsSnapshot = cloneInputs(getInputs());
    }
  
    const combination = findBestPricingCombination(studentsValue, classesPerWeekValue, latestPricingData);
    if (!combination) {
      if (accountingError) {
        accountingError.textContent = 'No pricing data matches those values. Add the combination to your table and recalculate.';
      }
      return;
    }
  
    const reportHtml = buildAccountingReport({
      studentsRequested: studentsValue,
      classesPerWeekRequested: classesPerWeekValue,
      hoursPerClassRequested: hoursPerClassValue,
      combination,
      inputs: latestInputsSnapshot,
      currencySymbol: latestInputsSnapshot?.currencySymbol || latestCurrencySymbol,
      pricingMode: latestPricingMode,
      bufferPercent: latestBufferPercent,
      bufferedMonthlyNet: latestPricingMode === PRICING_MODE_LESSON
        ? combination.column?.manualNet?.bufferedMonthly
        : combination.column?.buffered?.monthlyNet
    });
  
    if (!reportHtml) {
      if (accountingError) {
        accountingError.textContent = 'Unable to assemble the report. Please recalculate the table and try again.';
      }
      return;
    }
  
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `accounting-breakdown-${timestamp}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  
    if (accountingError) {
      accountingError.textContent = '';
    }
  
    closeAccountingDialog();
  
    if (controls.statusMessage) {
      controls.statusMessage.textContent = 'HTML download started. File contains an accountant-style monthly breakdown.';
      window.setTimeout(() => {
        if (controls.statusMessage) {
          controls.statusMessage.textContent = '';
        }
      }, 2500);
    }
  }
  
  if (howToLink) {
    howToLink.addEventListener('click', openReadme);
  }
  
  if (readmeClose) {
    readmeClose.addEventListener('click', closeReadme);
  }
  
  if (readmeBackdrop) {
    readmeBackdrop.addEventListener('click', closeReadme);
  }
  
  if (readmeDialog) {
    readmeDialog.addEventListener('click', event => {
      if (event.target === readmeDialog) {
        closeReadme();
      }
    });
  }
  
  if (controls.accountingExample instanceof HTMLButtonElement) {
    controls.accountingExample.addEventListener('click', openAccountingDialog);
  }
  
  if (accountingClose) {
    accountingClose.addEventListener('click', closeAccountingDialog);
  }
  
  if (accountingCancel) {
    accountingCancel.addEventListener('click', closeAccountingDialog);
  }
  
  if (accountingBackdrop) {
    accountingBackdrop.addEventListener('click', closeAccountingDialog);
  }
  
  if (accountingDialog) {
    accountingDialog.addEventListener('click', event => {
      if (event.target === accountingDialog) {
        closeAccountingDialog();
      }
    });
  }
  
  if (accountingForm) {
    accountingForm.addEventListener('submit', handleAccountingSubmit);
  }
  
  [accountingStudentsInput, accountingClassesInput, accountingHoursInput].forEach(input => {
    if (input instanceof HTMLInputElement) {
      input.addEventListener('input', () => {
        if (accountingError) {
          accountingError.textContent = '';
        }
      });
    }
  });
  
  if (breakdownClose) {
    breakdownClose.addEventListener('click', closeBreakdownDialog);
  }
  
  if (breakdownBackdrop) {
    breakdownBackdrop.addEventListener('click', closeBreakdownDialog);
  }
  
  if (breakdownDialog) {
    breakdownDialog.addEventListener('click', event => {
      if (event.target === breakdownDialog) {
        closeBreakdownDialog();
      }
    });
  }
  
  const themeToggleButton = document.getElementById('theme-toggle');
  const themeToggleLabel = themeToggleButton ? themeToggleButton.querySelector('.toggle-label') : null;
  const THEME_STORAGE_KEY = 'course-pricing-theme';
  const prefersDarkScheme = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : { matches: true };
  
  function getStoredTheme() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch (error) {
      // Ignore storage access errors (e.g. private browsing restrictions)
    }
    return null;
  }
  
  function applyThemePreference(theme, { save = true } = {}) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    document.body.dataset.theme = normalized;
  
    if (save) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, normalized);
      } catch (error) {
        // Ignore storage access errors
      }
    }
  
    if (themeToggleButton && themeToggleLabel) {
      const isDark = normalized === 'dark';
      const actionLabel = `Switch to ${isDark ? 'light' : 'dark'} mode`;
      themeToggleButton.setAttribute('aria-pressed', String(isDark));
      themeToggleButton.setAttribute('aria-label', actionLabel);
      themeToggleButton.setAttribute('title', actionLabel);
      themeToggleLabel.textContent = isDark ? 'Dark mode' : 'Light mode';
    }
  
    document.dispatchEvent(
      new CustomEvent('themechange', { detail: normalized })
    );
  }
  
  const storedTheme = getStoredTheme();
  let respectSystemPreference = !storedTheme;
  
  applyThemePreference(storedTheme || (prefersDarkScheme.matches ? 'dark' : 'light'), {
    save: Boolean(storedTheme)
  });
  
  function handlePreferenceChange(event) {
    if (respectSystemPreference) {
      applyThemePreference(event.matches ? 'dark' : 'light', { save: false });
    }
  }
  
  if (typeof prefersDarkScheme.addEventListener === 'function') {
    prefersDarkScheme.addEventListener('change', handlePreferenceChange);
  } else if (typeof prefersDarkScheme.addListener === 'function') {
    prefersDarkScheme.addListener(handlePreferenceChange);
  }
  
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      const nextTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      respectSystemPreference = false;
      applyThemePreference(nextTheme);
    });
  }
  
  const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
  
  let latestResults = [];
  let showBasePrices = false;
  let targetNetBasis = 'year';
  let desiredIncomeDisplayMode = 'net';
  let desiredIncomeLockedAsGross = false;
  let desiredIncomeLockedGrossValues = null;
  let acceptableIncomeLockedGrossMin = null;
  let acceptableIncomeLockedGrossMax = null;
  let acceptableIncomeLockedGrossMinBasis = null;
  let acceptableIncomeLockedGrossMaxBasis = null;
  let desiredIncomePreviousNetValues = null;
  const PRICING_MODE_TARGET = 'target';
  const PRICING_MODE_LESSON = 'lesson';
  let latestResultsMode = PRICING_MODE_TARGET;
  let latestPricingData = null;
  let latestCurrencySymbol = '€';
  let latestPricingMode = PRICING_MODE_TARGET;
  let latestBufferPercent = 0;
  let latestInputsSnapshot = null;
  const PERSISTED_TARGET_NET_BASIS_KEY = '__targetNetBasis';
  const PERSISTED_DESIRED_INCOME_DISPLAY_KEY = '__desiredIncomeDisplay';
  const PERSISTED_DESIRED_INCOME_LOCK_KEY = '__desiredIncomeLock';
  const PERSISTED_ACCEPTABLE_INCOME_MIN_KEY = '__acceptableIncomeMinAnnualNet';
  const PERSISTED_ACCEPTABLE_INCOME_MAX_KEY = '__acceptableIncomeMaxAnnualNet';
  const PERSISTED_ACCEPTABLE_INCOME_BASIS_KEY = '__acceptableIncomeBasis';
  const PERSISTED_COLLAPSED_SECTIONS_KEY = '__collapsedSectionsState';
  const TARGET_NET_BASIS_VALUES = ['year', 'week', 'month', 'avgWeek', 'avgMonth'];
  const TARGET_NET_BASIS_BY_INPUT_ID = {
    'target-net': 'year',
    'target-net-week': 'week',
    'target-net-month': 'month',
    'target-net-average-week': 'avgWeek',
    'target-net-average-month': 'avgMonth'
  };
  
  function getDesiredIncomeField(key) {
    const field = desiredIncomeFieldMap[key];
    return field instanceof HTMLInputElement ? field : null;
  }
  
  function readDesiredIncomeNet(key, fallback = null) {
    const field = getDesiredIncomeField(key);
    if (!field) {
      return fallback;
    }
    const stored = field.dataset.netValue;
    if (typeof stored === 'string' && stored.trim() !== '') {
      const parsed = Number(stored);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    const raw = field.value;
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return fallback;
  }
  
  function writeDesiredIncomeNet(key, value) {
    const field = getDesiredIncomeField(key);
    if (!field) {
      return;
    }
    if (Number.isFinite(value)) {
      field.dataset.netValue = String(value);
    } else {
      delete field.dataset.netValue;
    }
  }
  
  function captureDesiredIncomeNetValues() {
    return Object.keys(desiredIncomeFieldMap).reduce((accumulator, key) => {
      const value = readDesiredIncomeNet(key, null);
      if (Number.isFinite(value)) {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});
  }
  
  function restoreDesiredIncomeNetValues(values) {
    if (!values || typeof values !== 'object') {
      return;
    }
    Object.entries(values).forEach(([key, value]) => {
      if (Number.isFinite(value)) {
        writeDesiredIncomeNet(key, value);
      }
    });
  }
  
  function convertGrossToNet(value, taxRate) {
    if (!Number.isFinite(value)) {
      return null;
    }
    const normalizedRate = Math.min(Math.max(taxRate, 0), 0.9999);
    return value * (1 - normalizedRate);
  }
  
  function convertNetToGross(value, taxRate) {
    if (!Number.isFinite(value)) {
      return null;
    }
    const normalizedRate = Math.min(Math.max(taxRate, 0), 0.9999);
    const denominator = Math.max(1 - normalizedRate, 0.0001);
    return value / denominator;
  }
  
  function setDesiredIncomeLockedGrossValue(key, value) {
    if (!desiredIncomeLockedAsGross) {
      return;
    }
    if (!Number.isFinite(value)) {
      if (
        desiredIncomeLockedGrossValues &&
        Object.prototype.hasOwnProperty.call(desiredIncomeLockedGrossValues, key)
      ) {
        delete desiredIncomeLockedGrossValues[key];
      }
      return;
    }
    if (!desiredIncomeLockedGrossValues) {
      desiredIncomeLockedGrossValues = {};
    }
    desiredIncomeLockedGrossValues[key] = Math.max(value, 0);
  }
  
  function getDesiredIncomeLockedGrossValue(key, fallback = null) {
    if (!desiredIncomeLockedGrossValues) {
      return fallback;
    }
    const stored = desiredIncomeLockedGrossValues[key];
    return Number.isFinite(stored) ? stored : fallback;
  }
  
  function clearDesiredIncomeLockedGrossStore() {
    desiredIncomeLockedGrossValues = null;
  }
  
  function setLockedAcceptableIncomeGross(type, value, basis = acceptableIncomeBasis) {
    if (!desiredIncomeLockedAsGross) {
      return;
    }
    const normalizedBasis = ACCEPTABLE_INCOME_BASIS_VALUES.includes(basis) ? basis : acceptableIncomeBasis;
    if (!Number.isFinite(value)) {
      if (type === 'min') {
        acceptableIncomeLockedGrossMin = null;
        acceptableIncomeLockedGrossMinBasis = null;
      } else if (type === 'max') {
        acceptableIncomeLockedGrossMax = null;
        acceptableIncomeLockedGrossMaxBasis = null;
      }
      return;
    }
    const normalized = Math.max(value, 0);
    if (type === 'min') {
      acceptableIncomeLockedGrossMin = normalized;
      acceptableIncomeLockedGrossMinBasis = normalizedBasis;
    } else if (type === 'max') {
      acceptableIncomeLockedGrossMax = normalized;
      acceptableIncomeLockedGrossMaxBasis = normalizedBasis;
    }
  }
  
  function getLockedAcceptableIncomeGross(type) {
    const value = type === 'min' ? acceptableIncomeLockedGrossMin : acceptableIncomeLockedGrossMax;
    const basis = type === 'min' ? acceptableIncomeLockedGrossMinBasis : acceptableIncomeLockedGrossMaxBasis;
    return {
      value: Number.isFinite(value) ? value : null,
      basis: ACCEPTABLE_INCOME_BASIS_VALUES.includes(basis) ? basis : null
    };
  }
  
  function clearLockedAcceptableIncomeGross() {
    acceptableIncomeLockedGrossMin = null;
    acceptableIncomeLockedGrossMax = null;
    acceptableIncomeLockedGrossMinBasis = null;
    acceptableIncomeLockedGrossMaxBasis = null;
  }
  
  function synchronizeLockedDesiredIncomeNetValues(taxRate) {
    if (!desiredIncomeLockedAsGross) {
      return;
    }
  
    Object.entries(desiredIncomeFieldMap).forEach(([key, field]) => {
      if (!(field instanceof HTMLInputElement)) {
        return;
      }
  
      const cached = getDesiredIncomeLockedGrossValue(key, null);
      let grossValue = Number.isFinite(cached) ? cached : null;
  
      const raw = typeof field.value === 'string' ? field.value.trim() : '';
      if (raw !== '') {
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) {
          if (desiredIncomeDisplayMode === 'gross') {
            grossValue = Math.max(parsed, 0);
          } else {
            const derivedGross = convertNetToGross(parsed, taxRate);
            if (Number.isFinite(derivedGross)) {
              grossValue = Math.max(derivedGross, 0);
            }
          }
        }
      }
  
      if (!Number.isFinite(grossValue)) {
        writeDesiredIncomeNet(key, null);
        setDesiredIncomeLockedGrossValue(key, null);
        return;
      }
  
      const netValue = convertGrossToNet(grossValue, taxRate);
      if (!Number.isFinite(netValue)) {
        return;
      }
  
      writeDesiredIncomeNet(key, Math.max(netValue, 0));
      setDesiredIncomeLockedGrossValue(key, grossValue);
    });
  }
  
  function synchronizeLockedAcceptableIncomeNetValues(taxRate, activeMonths) {
    if (!desiredIncomeLockedAsGross) {
      return;
    }
  
    const months = Number.isFinite(activeMonths) && activeMonths > 0 ? activeMonths : MONTHS_PER_YEAR;
  
    const convertGrossBasisToAnnualNet = (grossValue, basis) => {
      if (!Number.isFinite(grossValue)) {
        return null;
      }
      const netBasis = convertGrossToNet(grossValue, taxRate);
      if (!Number.isFinite(netBasis)) {
        return null;
      }
      const effectiveBasis = ACCEPTABLE_INCOME_BASIS_VALUES.includes(basis)
        ? basis
        : acceptableIncomeBasis;
      if (effectiveBasis === 'annual') {
        return netBasis;
      }
      return netBasis * months;
    };
  
    const { value: minGross, basis: minBasis } = getLockedAcceptableIncomeGross('min');
    if (Number.isFinite(minGross)) {
      const annualNet = convertGrossBasisToAnnualNet(minGross, minBasis);
      acceptableIncomeMinAnnualNet = Number.isFinite(annualNet) ? Math.max(annualNet, 0) : null;
    } else {
      acceptableIncomeMinAnnualNet = null;
    }
  
    const { value: maxGross, basis: maxBasis } = getLockedAcceptableIncomeGross('max');
    if (Number.isFinite(maxGross)) {
      const annualNet = convertGrossBasisToAnnualNet(maxGross, maxBasis);
      acceptableIncomeMaxAnnualNet = Number.isFinite(annualNet) ? Math.max(annualNet, 0) : null;
    } else {
      acceptableIncomeMaxAnnualNet = null;
    }
  }
  
  const WEEKS_PER_YEAR = 52;
  const MONTHS_PER_YEAR = 12;
  const BASE_WORK_DAYS_PER_WEEK = 7;
  const TARGET_NET_DEFAULT = 50000;
  
  const ACCEPTABLE_INCOME_BASIS_VALUES = ['monthly', 'annual'];
  let acceptableIncomeBasis = 'monthly';
  let acceptableIncomeMinAnnualNet = null;
  let acceptableIncomeMaxAnnualNet = null;
  let previousAcceptableIncome = null;
  let lastActiveMonths = MONTHS_PER_YEAR;
  let lastWorkingWeeks = WEEKS_PER_YEAR;
  
  function updateDesiredIncomeTitle() {
    const isGross = desiredIncomeDisplayMode === 'gross';
    const title = isGross ? 'Desired Gross Income' : 'Desired Net Income';
    if (desiredIncomeTitle) {
      desiredIncomeTitle.textContent = title;
    }
    if (desiredIncomeLegend) {
      desiredIncomeLegend.textContent = isGross ? 'Desired gross income' : 'Desired net income';
    }
  }
  
  function updateDesiredIncomeLabels() {
    const isGross = desiredIncomeDisplayMode === 'gross';
    desiredIncomeLabelSpans.forEach(span => {
      const next = isGross ? span.dataset.grossLabel : span.dataset.netLabel;
      if (next) {
        span.textContent = next;
      }
    });
  }
  
  function updateDesiredIncomeTooltips() {
    const isGross = desiredIncomeDisplayMode === 'gross';
    desiredIncomeInfoIcons.forEach(icon => {
      if (!(icon instanceof HTMLElement)) {
        return;
      }
      const next = isGross ? icon.dataset.grossTooltip : icon.dataset.netTooltip;
      if (typeof next !== 'string') {
        return;
      }
      icon.dataset.tooltip = next;
      icon.setAttribute('aria-label', next);
      const parts = ensureInfoIconTooltip(icon);
      if (parts && parts.tooltip instanceof HTMLElement) {
        parts.tooltip.textContent = next;
      }
    });
  }
  
  function updateAcceptableIncomeBasisLabel() {
    if (!acceptableIncomeBasisLabel) {
      return;
    }
    const modeLabel = desiredIncomeDisplayMode === 'gross' ? 'Gross' : 'Net';
    const basisLabel = acceptableIncomeBasis === 'annual' ? 'Annual' : 'Monthly';
    acceptableIncomeBasisLabel.textContent = `${basisLabel} (${modeLabel})`;
  }
  
  function clearDesiredIncomeEditingState() {
    Object.values(desiredIncomeFieldMap).forEach(field => {
      if (field instanceof HTMLInputElement) {
        delete field.dataset.editing;
      }
    });
  }
  
  function clearAcceptableIncomeEditingState() {
    [controls.acceptableIncomeMin, controls.acceptableIncomeMax].forEach(field => {
      if (field instanceof HTMLInputElement) {
        delete field.dataset.editing;
      }
    });
  }
  
  function refreshDesiredIncomeDisplay(derivedNetValues, taxRate, options = {}) {
    const forceUpdate = options.force === true;
    updateDesiredIncomeTitle();
    updateDesiredIncomeLabels();
    updateAcceptableIncomeBasisLabel();
    updateDesiredIncomeTooltips();
  
    Object.entries(desiredIncomeFieldMap).forEach(([key, field]) => {
      if (!(field instanceof HTMLInputElement)) {
        return;
      }
      const isActiveBasis = targetNetBasis === key;
      let netValue = null;
      if (isActiveBasis) {
        const stored = readDesiredIncomeNet(key, null);
        if (Number.isFinite(stored)) {
          netValue = stored;
        } else if (Number.isFinite(derivedNetValues?.[key])) {
          netValue = derivedNetValues[key];
          writeDesiredIncomeNet(key, netValue);
        }
      } else if (Number.isFinite(derivedNetValues?.[key])) {
        netValue = derivedNetValues[key];
        writeDesiredIncomeNet(key, netValue);
      } else {
        netValue = null;
        writeDesiredIncomeNet(key, null);
      }
  
      const isEditing = field.dataset.editing === 'true';
  
      if (!Number.isFinite(netValue)) {
        if (!isEditing || forceUpdate) {
          field.value = '';
        }
        return;
      }
  
      const displayValue = desiredIncomeDisplayMode === 'gross'
        ? convertNetToGross(netValue, taxRate)
        : netValue;
  
      if (isEditing && !forceUpdate) {
        return;
      }
  
      field.value = formatFixed(displayValue, 2);
    });
  }
  
  function refreshAcceptableIncomeDisplay(taxRate, options = {}) {
    const forceUpdate = options.force === true;
    updateAcceptableIncomeBasisLabel();
    const minInput = controls.acceptableIncomeMin instanceof HTMLInputElement
      ? controls.acceptableIncomeMin
      : null;
    const maxInput = controls.acceptableIncomeMax instanceof HTMLInputElement
      ? controls.acceptableIncomeMax
      : null;
    const monthsForRange = lastActiveMonths > 0 ? lastActiveMonths : MONTHS_PER_YEAR;
  
    const toDisplay = annualNet => {
      if (!Number.isFinite(annualNet)) {
        return '';
      }
      const netBasis = acceptableIncomeBasis === 'annual'
        ? annualNet
        : annualNet / monthsForRange;
      const value = desiredIncomeDisplayMode === 'gross'
        ? convertNetToGross(netBasis, taxRate)
        : netBasis;
      return Number.isFinite(value) ? formatFixed(value, 2) : '';
    };
  
    if (minInput) {
      if (minInput.dataset.editing === 'true' && !forceUpdate) {
        // Keep the user's in-progress value.
      } else {
        minInput.value = toDisplay(acceptableIncomeMinAnnualNet);
      }
    }
    if (maxInput) {
      if (maxInput.dataset.editing === 'true' && !forceUpdate) {
        // Keep the user's in-progress value.
      } else {
        maxInput.value = toDisplay(acceptableIncomeMaxAnnualNet);
      }
    }
  }
  
  function initializeDesiredIncomeDatasets() {
    Object.entries(desiredIncomeFieldMap).forEach(([key, field]) => {
      if (!(field instanceof HTMLInputElement)) {
        return;
      }
      const raw = typeof field.value === 'string' ? field.value.trim() : '';
      if (raw === '') {
        writeDesiredIncomeNet(key, null);
        return;
      }
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) {
        writeDesiredIncomeNet(key, Math.max(parsed, 0));
      }
    });
  }
  
  function updateDesiredIncomeFromField(basis) {
    const field = getDesiredIncomeField(basis);
    if (!(field instanceof HTMLInputElement)) {
      return;
    }
    const raw = typeof field.value === 'string' ? field.value.trim() : '';
    if (raw === '') {
      writeDesiredIncomeNet(basis, null);
      if (desiredIncomeLockedAsGross) {
        setDesiredIncomeLockedGrossValue(basis, null);
      } else if (desiredIncomeLockedGrossValues) {
        delete desiredIncomeLockedGrossValues[basis];
      }
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      if (desiredIncomeLockedAsGross) {
        setDesiredIncomeLockedGrossValue(basis, null);
      }
      return;
    }
    const taxRate = getCurrentTaxRate();
    const netValue = desiredIncomeDisplayMode === 'gross'
      ? convertGrossToNet(parsed, taxRate)
      : parsed;
    writeDesiredIncomeNet(basis, Math.max(netValue, 0));
    if (desiredIncomeLockedAsGross) {
      const grossForStore = desiredIncomeDisplayMode === 'gross'
        ? parsed
        : convertNetToGross(parsed, taxRate);
      if (Number.isFinite(grossForStore)) {
        setDesiredIncomeLockedGrossValue(basis, Math.max(grossForStore, 0));
      } else {
        setDesiredIncomeLockedGrossValue(basis, null);
      }
    } else if (desiredIncomeLockedGrossValues) {
      delete desiredIncomeLockedGrossValues[basis];
    }
  }
  
  function updateAcceptableIncomeFromInput(type) {
    const input = type === 'min' ? controls.acceptableIncomeMin : controls.acceptableIncomeMax;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    const raw = typeof input.value === 'string' ? input.value.trim() : '';
    if (raw === '') {
      if (type === 'min') {
        acceptableIncomeMinAnnualNet = null;
      } else {
        acceptableIncomeMaxAnnualNet = null;
      }
      if (desiredIncomeLockedAsGross) {
        setLockedAcceptableIncomeGross(type, null);
      }
      return;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      if (desiredIncomeLockedAsGross) {
        setLockedAcceptableIncomeGross(type, null);
      }
      return;
    }
    const taxRate = getCurrentTaxRate();
    const netValue = desiredIncomeDisplayMode === 'gross'
      ? convertGrossToNet(parsed, taxRate)
      : parsed;
    const normalizedNet = Math.max(netValue, 0);
    if (desiredIncomeLockedAsGross) {
      const grossForStore = desiredIncomeDisplayMode === 'gross'
        ? parsed
        : convertNetToGross(parsed, taxRate);
      if (Number.isFinite(grossForStore)) {
        setLockedAcceptableIncomeGross(type, Math.max(grossForStore, 0), acceptableIncomeBasis);
      } else {
        setLockedAcceptableIncomeGross(type, null);
      }
    }
    const months = lastActiveMonths > 0 ? lastActiveMonths : MONTHS_PER_YEAR;
    const annualNet = acceptableIncomeBasis === 'annual'
      ? normalizedNet
      : normalizedNet * months;
    if (type === 'min') {
      acceptableIncomeMinAnnualNet = Number.isFinite(annualNet) ? annualNet : null;
    } else {
      acceptableIncomeMaxAnnualNet = Number.isFinite(annualNet) ? annualNet : null;
    }
    previousAcceptableIncome = null;
  }
  
  const desiredIncomeTitle = document.getElementById('desired-income-title');
  const desiredIncomeLegend = document.getElementById('section-desired-income-legend');
  const acceptableIncomeBasisLabel = document.getElementById('acceptable-income-current-basis');
  const desiredIncomeLabelSpans = Array.from(
    document.querySelectorAll('#section-desired-income .label-text[data-net-label][data-gross-label]')
  );
  const desiredIncomeInfoIcons = Array.from(
    document.querySelectorAll('#section-desired-income .info-icon[data-net-tooltip][data-gross-tooltip]')
  );
  
  const fixedCostFields = {
    location: {
      monthly: document.getElementById('fixed-cost-location-monthly'),
      annual: document.getElementById('fixed-cost-location-annual')
    },
    insurance: {
      monthly: document.getElementById('fixed-cost-insurance-monthly'),
      annual: document.getElementById('fixed-cost-insurance-annual')
    },
    disability: {
      monthly: document.getElementById('fixed-cost-disability-monthly'),
      annual: document.getElementById('fixed-cost-disability-annual')
    },
    health: {
      monthly: document.getElementById('fixed-cost-health-monthly'),
      annual: document.getElementById('fixed-cost-health-annual')
    },
    pension: {
      monthly: document.getElementById('fixed-cost-pension-monthly'),
      annual: document.getElementById('fixed-cost-pension-annual')
    },
    marketing: {
      monthly: document.getElementById('fixed-cost-marketing-monthly'),
      annual: document.getElementById('fixed-cost-marketing-annual')
    },
    materials: {
      monthly: document.getElementById('fixed-cost-materials-monthly'),
      annual: document.getElementById('fixed-cost-materials-annual')
    },
    admin: {
      monthly: document.getElementById('fixed-cost-admin-monthly'),
      annual: document.getElementById('fixed-cost-admin-annual')
    },
    development: {
      monthly: document.getElementById('fixed-cost-development-monthly'),
      annual: document.getElementById('fixed-cost-development-annual')
    }
  };
  
  controls.fixedCostFields = fixedCostFields;
  
  const rememberInputsToggle = controls.rememberInputs instanceof HTMLInputElement ? controls.rememberInputs : null;
  const resetSavedInputsButton = controls.resetSavedInputs instanceof HTMLButtonElement ? controls.resetSavedInputs : null;
  const PERSISTENCE_ENABLED_KEY = 'course-pricing-save-enabled';
  const PERSISTENCE_VALUES_KEY = 'course-pricing-saved-inputs';
  let persistenceEnabled = false;
  let persistableInputsCache = null;
  
  initializeDesiredIncomeDatasets();
  updateDesiredIncomeTitle();
  updateDesiredIncomeLabels();
  updateAcceptableIncomeBasisLabel();
  
  function getPersistableInputs() {
    if (persistableInputsCache) {
      return persistableInputsCache;
    }
    const container = document.querySelector('.card.controls');
    if (!(container instanceof HTMLElement)) {
      persistableInputsCache = [];
      return persistableInputsCache;
    }
    persistableInputsCache = Array.from(container.querySelectorAll('input')).filter(input => {
      return input instanceof HTMLInputElement && input.type !== 'button' && input.id !== 'remember-inputs';
    });
    return persistableInputsCache;
  }
  
  function captureInputValues(inputs = getPersistableInputs()) {
    const values = inputs.reduce((accumulator, input) => {
      if (!(input instanceof HTMLInputElement) || !input.id) {
        return accumulator;
      }
      if (input.type === 'checkbox' || input.type === 'radio') {
        accumulator[input.id] = input.checked;
      } else {
        accumulator[input.id] = input.value;
      }
      return accumulator;
    }, {});
    values[PERSISTED_TARGET_NET_BASIS_KEY] = targetNetBasis;
    values[PERSISTED_DESIRED_INCOME_DISPLAY_KEY] = desiredIncomeDisplayMode;
    values[PERSISTED_DESIRED_INCOME_LOCK_KEY] = desiredIncomeLockedAsGross;
    values[PERSISTED_ACCEPTABLE_INCOME_MIN_KEY] = Number.isFinite(acceptableIncomeMinAnnualNet)
      ? acceptableIncomeMinAnnualNet
      : null;
    values[PERSISTED_ACCEPTABLE_INCOME_MAX_KEY] = Number.isFinite(acceptableIncomeMaxAnnualNet)
      ? acceptableIncomeMaxAnnualNet
      : null;
    values[PERSISTED_ACCEPTABLE_INCOME_BASIS_KEY] = acceptableIncomeBasis;
    values[PERSISTED_COLLAPSED_SECTIONS_KEY] = captureCollapsibleSectionStates();
    Object.keys(desiredIncomeFieldMap).forEach(key => {
      const netValue = readDesiredIncomeNet(key, null);
      values[`__desiredIncomeNet_${key}`] = Number.isFinite(netValue) ? netValue : null;
    });
    return values;
  }
  
  const defaultInputValues = captureInputValues();
  
  function readPersistenceEnabled() {
    try {
      return localStorage.getItem(PERSISTENCE_ENABLED_KEY) === 'true';
    } catch (error) {
      return false;
    }
  }
  
  function readPersistedValues() {
    try {
      const raw = localStorage.getItem(PERSISTENCE_VALUES_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return null;
  }
  
  function clearPersistedInputs() {
    try {
      localStorage.removeItem(PERSISTENCE_VALUES_KEY);
      localStorage.removeItem(PERSISTENCE_ENABLED_KEY);
    } catch (error) {
      // Ignore storage errors
    }
  }
  
  function applyInputValues(values, options = {}) {
    const { skipRender = false } = options;
    if (!values || typeof values !== 'object') {
      return;
    }
    const storedBasis = values[PERSISTED_TARGET_NET_BASIS_KEY];
    if (typeof storedBasis === 'string' && TARGET_NET_BASIS_VALUES.includes(storedBasis)) {
      targetNetBasis = storedBasis;
    }
    const storedDisplay = values[PERSISTED_DESIRED_INCOME_DISPLAY_KEY];
    if (storedDisplay === 'gross' || storedDisplay === 'net') {
      desiredIncomeDisplayMode = storedDisplay;
    }
    desiredIncomeLockedAsGross = Boolean(values[PERSISTED_DESIRED_INCOME_LOCK_KEY]);
    const storedAcceptableBasis = values[PERSISTED_ACCEPTABLE_INCOME_BASIS_KEY];
    if (typeof storedAcceptableBasis === 'string' && ACCEPTABLE_INCOME_BASIS_VALUES.includes(storedAcceptableBasis)) {
      acceptableIncomeBasis = storedAcceptableBasis;
    }
    const storedAcceptableMinRaw = values[PERSISTED_ACCEPTABLE_INCOME_MIN_KEY];
    if (storedAcceptableMinRaw === null || typeof storedAcceptableMinRaw === 'undefined') {
      acceptableIncomeMinAnnualNet = null;
    } else {
      const storedAcceptableMin = Number(storedAcceptableMinRaw);
      acceptableIncomeMinAnnualNet = Number.isFinite(storedAcceptableMin) ? storedAcceptableMin : null;
    }
    const storedAcceptableMaxRaw = values[PERSISTED_ACCEPTABLE_INCOME_MAX_KEY];
    if (storedAcceptableMaxRaw === null || typeof storedAcceptableMaxRaw === 'undefined') {
      acceptableIncomeMaxAnnualNet = null;
    } else {
      const storedAcceptableMax = Number(storedAcceptableMaxRaw);
      // Only coerce persisted values when they exist so blanks reload as an open range.
      acceptableIncomeMaxAnnualNet = Number.isFinite(storedAcceptableMax) ? storedAcceptableMax : null;
    }
    const inputs = getPersistableInputs();
    inputs.forEach(input => {
      if (!(input instanceof HTMLInputElement) || !input.id) {
        return;
      }
      if (!Object.prototype.hasOwnProperty.call(values, input.id)) {
        return;
      }
      const storedValue = values[input.id];
      if (input.type === 'checkbox' || input.type === 'radio') {
        input.checked = Boolean(storedValue);
      } else {
        input.value = storedValue === null || typeof storedValue === 'undefined'
          ? ''
          : String(storedValue);
      }
    });
    Object.keys(desiredIncomeFieldMap).forEach(key => {
      const storedNetKey = `__desiredIncomeNet_${key}`;
      const storedNet = Number(values[storedNetKey]);
      if (Number.isFinite(storedNet)) {
        writeDesiredIncomeNet(key, Math.max(storedNet, 0));
        return;
      }
      const field = getDesiredIncomeField(key);
      if (!(field instanceof HTMLInputElement)) {
        writeDesiredIncomeNet(key, null);
        return;
      }
      const raw = typeof field.value === 'string' ? field.value.trim() : '';
      if (raw === '') {
        writeDesiredIncomeNet(key, null);
        return;
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) {
        writeDesiredIncomeNet(key, null);
        return;
      }
      const taxRate = getCurrentTaxRate();
      const netValue = desiredIncomeDisplayMode === 'gross'
        ? convertGrossToNet(parsed, taxRate)
        : parsed;
      writeDesiredIncomeNet(key, Math.max(netValue, 0));
    });
    if (desiredIncomeLockedAsGross) {
      synchronizeLockedDesiredIncomeNetValues(getCurrentTaxRate());
      updateAcceptableIncomeFromInput('min');
      updateAcceptableIncomeFromInput('max');
    } else {
      clearDesiredIncomeLockedGrossStore();
      clearLockedAcceptableIncomeGross();
    }
    const storedCollapsedStates = values[PERSISTED_COLLAPSED_SECTIONS_KEY];
    if (storedCollapsedStates && typeof storedCollapsedStates === 'object') {
      applyCollapsibleSectionStates(storedCollapsedStates, { skipPersistence: true });
    }
    updateDesiredIncomeTitle();
    updateDesiredIncomeLabels();
    updateAcceptableIncomeBasisLabel();
    updateFixedCostTotalDisplay();
    if (!skipRender) {
      render();
    }
  }
  
  function savePersistedInputs() {
    if (!persistenceEnabled) {
      return;
    }
    try {
      const values = captureInputValues();
      localStorage.setItem(PERSISTENCE_VALUES_KEY, JSON.stringify(values));
      localStorage.setItem(PERSISTENCE_ENABLED_KEY, 'true');
    } catch (error) {
      persistenceEnabled = false;
      if (rememberInputsToggle) {
        rememberInputsToggle.checked = false;
      }
    }
  }
  
  function handlePersistableInputMutation(event) {
    if (event && event.target instanceof HTMLInputElement) {
      const nextBasis = TARGET_NET_BASIS_BY_INPUT_ID[event.target.id];
      if (typeof nextBasis === 'string') {
        targetNetBasis = nextBasis;
      }
    }
    if (persistenceEnabled) {
      savePersistedInputs();
    }
  }
  
  function initializePersistence() {
    if (rememberInputsToggle) {
      rememberInputsToggle.checked = readPersistenceEnabled();
      persistenceEnabled = rememberInputsToggle.checked;
    } else {
      persistenceEnabled = false;
    }
  
    const storedValues = persistenceEnabled ? readPersistedValues() : null;
    if (storedValues) {
      applyInputValues(storedValues, { skipRender: true });
    }
  
    getPersistableInputs().forEach(input => {
      input.addEventListener('input', handlePersistableInputMutation);
      input.addEventListener('change', handlePersistableInputMutation);
    });
  
    if (rememberInputsToggle) {
      rememberInputsToggle.addEventListener('change', () => {
        persistenceEnabled = rememberInputsToggle.checked;
        if (persistenceEnabled) {
          savePersistedInputs();
        } else {
          clearPersistedInputs();
        }
      });
    }
  
    if (resetSavedInputsButton) {
      resetSavedInputsButton.addEventListener('click', () => {
        applyInputValues(defaultInputValues);
        if (persistenceEnabled) {
          savePersistedInputs();
        } else {
          clearPersistedInputs();
        }
      });
    }
  }
  
  const tablesContainer = document.getElementById('tables-container');
  let tablesLayoutUpdateScheduled = false;
  const assumptionsList = document.getElementById('assumptions-list');
  
  const INFO_ICON_ACTIVE_CLASS = 'is-active';
  const TOOLTIP_VIEWPORT_PADDING = 16;
  let activeInfoIcon = null;
  let infoIconTooltipId = 0;
  
  function isInfoIcon(element) {
    return element instanceof HTMLElement && element.classList.contains('info-icon');
  }
  
  function ensureInfoIconTooltip(icon) {
    if (!isInfoIcon(icon)) {
      return null;
    }
    let tooltip = icon.querySelector('.info-icon__tooltip');
    if (!(tooltip instanceof HTMLElement)) {
      tooltip = document.createElement('span');
      tooltip.className = 'info-icon__tooltip';
      tooltip.setAttribute('role', 'tooltip');
      icon.append(tooltip);
    }
    let arrow = icon.querySelector('.info-icon__arrow');
    if (!(arrow instanceof HTMLElement)) {
      arrow = document.createElement('span');
      arrow.className = 'info-icon__arrow';
      arrow.setAttribute('aria-hidden', 'true');
      icon.append(arrow);
    }
    const tooltipText = icon.dataset.tooltip || icon.getAttribute('aria-label') || '';
    tooltip.textContent = tooltipText;
    if (!tooltip.id) {
      infoIconTooltipId += 1;
      tooltip.id = `info-icon-tooltip-${infoIconTooltipId}`;
    }
    if (!icon.hasAttribute('aria-describedby')) {
      icon.setAttribute('aria-describedby', tooltip.id);
    }
    return { tooltip, arrow };
  }
  
  function positionInfoIconTooltip(icon) {
    if (!isInfoIcon(icon)) {
      return;
    }
    const parts = ensureInfoIconTooltip(icon);
    if (!parts || !(parts.tooltip instanceof HTMLElement)) {
      return;
    }
    icon.style.setProperty('--tooltip-shift', '0px');
    const tooltipRect = parts.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
    const padding = TOOLTIP_VIEWPORT_PADDING;
    let shift = 0;
    if (tooltipRect.left < padding) {
      shift = padding - tooltipRect.left;
    } else if (tooltipRect.right > viewportWidth - padding) {
      shift = -(tooltipRect.right - (viewportWidth - padding));
    }
    icon.style.setProperty('--tooltip-shift', `${shift}px`);
  }
  
  function enhanceInfoIcon(icon) {
    if (!isInfoIcon(icon)) {
      return;
    }
    if (!icon.hasAttribute('tabindex')) {
      icon.setAttribute('tabindex', '0');
    }
    icon.setAttribute('role', 'button');
    icon.setAttribute('aria-expanded', icon.classList.contains(INFO_ICON_ACTIVE_CLASS) ? 'true' : 'false');
    if (!icon.hasAttribute('aria-label') && icon.dataset.tooltip) {
      icon.setAttribute('aria-label', icon.dataset.tooltip);
    }
    ensureInfoIconTooltip(icon);
  }
  
  function enhanceAllInfoIcons() {
    document.querySelectorAll('.info-icon').forEach(enhanceInfoIcon);
  }
  
  function closeActiveInfoIcon() {
    if (activeInfoIcon instanceof HTMLElement) {
      activeInfoIcon.classList.remove(INFO_ICON_ACTIVE_CLASS);
      activeInfoIcon.setAttribute('aria-expanded', 'false');
    }
    activeInfoIcon = null;
  }
  
  function openInfoIcon(icon) {
    if (!isInfoIcon(icon)) {
      return;
    }
    if (activeInfoIcon && activeInfoIcon !== icon) {
      closeActiveInfoIcon();
    }
    icon.classList.add(INFO_ICON_ACTIVE_CLASS);
    icon.setAttribute('aria-expanded', 'true');
    activeInfoIcon = icon;
    positionInfoIconTooltip(icon);
  }
  
  function toggleInfoIcon(icon) {
    if (!isInfoIcon(icon)) {
      return;
    }
    if (icon.classList.contains(INFO_ICON_ACTIVE_CLASS)) {
      if (activeInfoIcon === icon) {
        closeActiveInfoIcon();
      } else {
        icon.classList.remove(INFO_ICON_ACTIVE_CLASS);
        icon.setAttribute('aria-expanded', 'false');
      }
    } else {
      openInfoIcon(icon);
    }
  }
  
  document.addEventListener('click', event => {
    const target = event.target instanceof HTMLElement ? event.target.closest('.info-icon') : null;
    if (!isInfoIcon(target)) {
      closeActiveInfoIcon();
      return;
    }
    event.preventDefault();
    enhanceInfoIcon(target);
    toggleInfoIcon(target);
    positionInfoIconTooltip(target);
    if (typeof target.focus === 'function') {
      target.focus();
    }
  });
  
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (activeInfoIcon) {
        event.preventDefault();
        const current = activeInfoIcon;
        closeActiveInfoIcon();
        if (current instanceof HTMLElement && typeof current.focus === 'function') {
          current.focus();
        }
      }
      return;
    }
  
    const target = event.target instanceof HTMLElement ? event.target.closest('.info-icon') : null;
    if (!isInfoIcon(target)) {
      return;
    }
  
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      enhanceInfoIcon(target);
      toggleInfoIcon(target);
      positionInfoIconTooltip(target);
    }
  });
  
  document.addEventListener('focusin', event => {
    const target = event.target instanceof HTMLElement ? event.target.closest('.info-icon') : null;
    if (!isInfoIcon(target)) {
      closeActiveInfoIcon();
      return;
    }
    enhanceInfoIcon(target);
    positionInfoIconTooltip(target);
  });
  
  enhanceAllInfoIcons();
  
  document.addEventListener('mouseover', event => {
    const target = event.target instanceof HTMLElement ? event.target.closest('.info-icon') : null;
    if (!isInfoIcon(target)) {
      return;
    }
    positionInfoIconTooltip(target);
  });
  
  window.addEventListener('resize', () => {
    if (activeInfoIcon) {
      positionInfoIconTooltip(activeInfoIcon);
    }
  });
  
  function formatFixed(value, fractionDigits = 1) {
    const fixed = value.toFixed(fractionDigits);
    return fixed
      .replace(/\.0+$/, '')
      .replace(/(\.[0-9]*[1-9])0+$/, '$1');
  }
  
  function parseNumber(value, fallback = 0, { min = -Infinity, max = Infinity } = {}) {
    if (value === null || value === undefined) {
      return fallback;
    }
    const normalized = typeof value === 'string' ? value.trim() : value;
    if (normalized === '') {
      return fallback;
    }
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(Math.max(parsed, min), max);
  }
  
  function getCurrentTaxRate() {
    const percent = Math.min(Math.max(parseNumber(controls.taxRate?.value, 40), 0), 99.9);
    return percent / 100;
  }
  
  function parseList(value) {
    if (!value) {
      return [];
    }
  
    const values = [];
    const tokens = value
      .split(',')
      .map(token => token.trim())
      .filter(token => token.length > 0);
  
    tokens.forEach(token => {
      const rangeMatch = token.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/);
      if (rangeMatch) {
        const startValue = Math.round(Number(rangeMatch[1]));
        const endValue = Math.round(Number(rangeMatch[2]));
        if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) {
          return;
        }
  
        const rangeStart = Math.min(startValue, endValue);
        const rangeEnd = Math.max(startValue, endValue);
        for (let current = rangeStart; current <= rangeEnd; current += 1) {
          if (current > 0) {
            values.push(current);
          }
        }
        return;
      }
  
      const parsed = Math.round(Number(token));
      if (Number.isFinite(parsed) && parsed > 0) {
        values.push(parsed);
      }
    });
  
    return Array.from(new Set(values)).sort((a, b) => a - b);
  }
  
  function updateTablesLayout() {
    if (!tablesContainer) {
      return;
    }
  
    const cards = tablesContainer.querySelectorAll('.card');
    if (cards.length <= 1) {
      tablesContainer.classList.remove('table-grid--stacked');
      return;
    }
  
    const hasOverflow = tablesContainer.scrollWidth > tablesContainer.clientWidth + 1;
    tablesContainer.classList.toggle('table-grid--stacked', hasOverflow);
  }
  
  function scheduleTablesLayoutUpdate() {
    if (!tablesContainer) {
      return;
    }
    if (tablesLayoutUpdateScheduled) {
      return;
    }
  
    tablesLayoutUpdateScheduled = true;
    requestAnimationFrame(() => {
      tablesLayoutUpdateScheduled = false;
      updateTablesLayout();
    });
  }
  
  function getFixedCostTotal() {
    return Object.values(fixedCostFields).reduce((sum, fieldSet) => {
      if (!(fieldSet.annual instanceof HTMLInputElement)) {
        return sum;
      }
      const annualValue = Math.max(parseNumber(fieldSet.annual.value, 0), 0);
      return sum + annualValue;
    }, 0);
  }
  
  function updateFixedCostTotalDisplay() {
    const total = getFixedCostTotal();
    if (controls.fixedCosts instanceof HTMLInputElement) {
      controls.fixedCosts.value = formatFixed(total, 2);
    }
    return total;
  }
  
  function syncFixedCostPair(key, sourceType) {
    const fieldSet = fixedCostFields[key];
    if (!fieldSet) {
      return;
    }
    const source = sourceType === 'monthly' ? fieldSet.monthly : fieldSet.annual;
    const target = sourceType === 'monthly' ? fieldSet.annual : fieldSet.monthly;
    if (!(source instanceof HTMLInputElement) || !(target instanceof HTMLInputElement)) {
      return;
    }
  
    if (source.value === '') {
      target.value = '';
      updateFixedCostTotalDisplay();
      return;
    }
  
    const parsed = Math.max(parseNumber(source.value, 0), 0);
    const derived = sourceType === 'monthly' ? parsed * 12 : parsed / 12;
  
    if (Number.isFinite(derived)) {
      target.value = formatFixed(derived, 2);
    }
  
    updateFixedCostTotalDisplay();
  }
  
  Object.entries(fixedCostFields).forEach(([key, fieldSet]) => {
    const { monthly, annual } = fieldSet;
    if (monthly instanceof HTMLInputElement) {
      monthly.addEventListener('input', () => {
        syncFixedCostPair(key, 'monthly');
        render();
      });
      monthly.addEventListener('change', () => {
        syncFixedCostPair(key, 'monthly');
        if (monthly.value !== '') {
          const normalized = Math.max(parseNumber(monthly.value, 0), 0);
          monthly.value = formatFixed(normalized, 2);
        }
        render();
      });
    }
    if (annual instanceof HTMLInputElement) {
      annual.addEventListener('input', () => {
        syncFixedCostPair(key, 'annual');
        render();
      });
      annual.addEventListener('change', () => {
        syncFixedCostPair(key, 'annual');
        if (annual.value !== '') {
          const normalized = Math.max(parseNumber(annual.value, 0), 0);
          annual.value = formatFixed(normalized, 2);
        }
        render();
      });
    }
  });
  
  function getInputs() {
    const monthsOff = parseNumber(controls.monthsOff.value, 2, { min: 0, max: 12 });
    const weeksOffPerCycle = parseNumber(controls.weeksOffCycle.value, 1, { min: 0, max: 4 });
    const daysOffPerWeek = parseNumber(controls.daysOffWeek.value, 2, { min: 0, max: BASE_WORK_DAYS_PER_WEEK });
  
    const taxRatePercent = Math.min(Math.max(parseNumber(controls.taxRate.value, 40), 0), 99.9);
    const taxRate = taxRatePercent / 100;
    if (desiredIncomeLockedAsGross) {
      synchronizeLockedDesiredIncomeNetValues(taxRate);
    }
    const fixedCosts = updateFixedCostTotalDisplay();
    const variableCostPerClass = Math.max(parseNumber(controls.variableCostPerClass.value, 0), 0);
    const variableCostPerStudent = Math.max(parseNumber(controls.variableCostPerStudent.value, 0), 0);
    const variableCostPerStudentMonthly = Math.max(parseNumber(controls.variableCostPerStudentMonthly.value, 0), 0);
    const vatRate = Math.max(parseNumber(controls.vatRate.value, 21), 0) / 100;
    const classesPerWeek = parseList(controls.classesPerWeek.value);
    const studentsPerClass = parseList(controls.studentsPerClass.value);
    const hoursPerLesson = Math.max(parseNumber(controls.hoursPerLesson.value, 1, { min: 0.25, max: 12 }), 0.25);
    const bufferPercent = Math.max(parseNumber(controls.buffer.value, 15), 0);
    const buffer = bufferPercent / 100;
    const currencySymbol = controls.currencySymbol.value.trim() || '€';
    let lessonCostInclVat = null;
    if (controls.lessonCost instanceof HTMLInputElement) {
      const rawLessonCost = controls.lessonCost.value;
      if (typeof rawLessonCost === 'string' && rawLessonCost.trim() !== '') {
        const parsedLessonCost = Number(rawLessonCost);
        if (Number.isFinite(parsedLessonCost) && parsedLessonCost >= 0) {
          lessonCostInclVat = parsedLessonCost;
        }
      }
    }
  
    let lessonPriceMin = null;
    if (controls.lessonPriceMin instanceof HTMLInputElement) {
      const rawMin = controls.lessonPriceMin.value;
      if (typeof rawMin === 'string' && rawMin.trim() !== '') {
        const parsedMin = Number(rawMin);
        if (Number.isFinite(parsedMin) && parsedMin >= 0) {
          lessonPriceMin = parsedMin;
        }
      }
    }
  
    let lessonPriceMax = null;
    if (controls.lessonPriceMax instanceof HTMLInputElement) {
      const rawMax = controls.lessonPriceMax.value;
      if (typeof rawMax === 'string' && rawMax.trim() !== '') {
        const parsedMax = Number(rawMax);
        if (Number.isFinite(parsedMax) && parsedMax >= 0) {
          lessonPriceMax = parsedMax;
        }
      }
    }
  
    if (lessonPriceMin != null && lessonPriceMax != null && lessonPriceMin > lessonPriceMax) {
      const tempMin = lessonPriceMax;
      lessonPriceMax = lessonPriceMin;
      lessonPriceMin = tempMin;
    }
  
    const activeMonthShare = Math.min(Math.max((12 - monthsOff) / 12, 0), 1);
    const activeMonths = 12 * activeMonthShare;
    const weeksShare = Math.min(Math.max((4 - weeksOffPerCycle) / 4, 0), 1);
    const workingWeeks = WEEKS_PER_YEAR * activeMonthShare * weeksShare;
    const workingDaysPerWeek = Math.max(
      0,
      Math.min(BASE_WORK_DAYS_PER_WEEK, BASE_WORK_DAYS_PER_WEEK - daysOffPerWeek)
    );
    const workingDaysPerYear = workingWeeks * workingDaysPerWeek;
  
    lastActiveMonths = activeMonths;
    lastWorkingWeeks = workingWeeks;
    if (desiredIncomeLockedAsGross) {
      synchronizeLockedAcceptableIncomeNetValues(taxRate, activeMonths);
    }
  
    const defaultTargetNetWeek = workingWeeks > 0 ? TARGET_NET_DEFAULT / workingWeeks : TARGET_NET_DEFAULT;
    const defaultTargetNetMonth = activeMonths > 0 ? TARGET_NET_DEFAULT / activeMonths : TARGET_NET_DEFAULT;
    const defaultTargetNetAverageWeek = TARGET_NET_DEFAULT / WEEKS_PER_YEAR;
    const defaultTargetNetAverageMonth = TARGET_NET_DEFAULT / MONTHS_PER_YEAR;
  
    const storedYearNet = readDesiredIncomeNet('year', null);
    const storedWeekNet = readDesiredIncomeNet('week', null);
    const storedMonthNet = readDesiredIncomeNet('month', null);
    const storedAvgWeekNet = readDesiredIncomeNet('avgWeek', null);
    const storedAvgMonthNet = readDesiredIncomeNet('avgMonth', null);
  
    const netYearValue = Number.isFinite(storedYearNet) ? Math.max(storedYearNet, 0) : TARGET_NET_DEFAULT;
    const netWeekValue = Number.isFinite(storedWeekNet)
      ? Math.max(storedWeekNet, 0)
      : defaultTargetNetWeek;
    const netMonthValue = Number.isFinite(storedMonthNet)
      ? Math.max(storedMonthNet, 0)
      : defaultTargetNetMonth;
    const netAvgWeekValue = Number.isFinite(storedAvgWeekNet)
      ? Math.max(storedAvgWeekNet, 0)
      : defaultTargetNetAverageWeek;
    const netAvgMonthValue = Number.isFinite(storedAvgMonthNet)
      ? Math.max(storedAvgMonthNet, 0)
      : defaultTargetNetAverageMonth;
  
    const hasWorkingWeeks = workingWeeks > 0;
    const hasActiveMonths = activeMonths > 0;
  
    let targetNet;
    if (targetNetBasis === 'week') {
      targetNet = hasWorkingWeeks ? netWeekValue * workingWeeks : netYearValue;
    } else if (targetNetBasis === 'month') {
      targetNet = hasActiveMonths ? netMonthValue * activeMonths : netYearValue;
    } else if (targetNetBasis === 'avgWeek') {
      targetNet = netAvgWeekValue * WEEKS_PER_YEAR;
    } else if (targetNetBasis === 'avgMonth') {
      targetNet = netAvgMonthValue * MONTHS_PER_YEAR;
    } else {
      targetNet = netYearValue;
    }
  
    targetNet = Number.isFinite(targetNet) ? Math.max(targetNet, 0) : TARGET_NET_DEFAULT;
  
    const targetNetPerWeek = hasWorkingWeeks ? targetNet / workingWeeks : null;
    const targetNetPerMonth = hasActiveMonths ? targetNet / activeMonths : null;
    const targetNetAveragePerWeek = targetNet / WEEKS_PER_YEAR;
    const targetNetAveragePerMonth = targetNet / MONTHS_PER_YEAR;
  
    const derivedNetValues = {
      year: targetNet,
      week: targetNetPerWeek,
      month: targetNetPerMonth,
      avgWeek: targetNetAveragePerWeek,
      avgMonth: targetNetAveragePerMonth
    };
  
    Object.entries(derivedNetValues).forEach(([key, value]) => {
      if (key === targetNetBasis) {
        if (!Number.isFinite(readDesiredIncomeNet(key, null)) && Number.isFinite(value)) {
          writeDesiredIncomeNet(key, value);
        }
        return;
      }
      if (Number.isFinite(value)) {
        writeDesiredIncomeNet(key, value);
      } else {
        writeDesiredIncomeNet(key, null);
      }
    });
  
    refreshDesiredIncomeDisplay(derivedNetValues, taxRate);
    refreshAcceptableIncomeDisplay(taxRate);
  
    controls.taxRate.value = formatFixed(taxRate * 100, 1);
    controls.fixedCosts.value = formatFixed(fixedCosts, 2);
    if (controls.variableCostPerClass instanceof HTMLInputElement) {
      controls.variableCostPerClass.value = formatFixed(variableCostPerClass, 2);
    }
    if (controls.variableCostPerStudent instanceof HTMLInputElement) {
      controls.variableCostPerStudent.value = formatFixed(variableCostPerStudent, 2);
    }
    if (controls.variableCostPerStudentMonthly instanceof HTMLInputElement) {
      controls.variableCostPerStudentMonthly.value = formatFixed(variableCostPerStudentMonthly, 2);
    }
    controls.vatRate.value = formatFixed(vatRate * 100, 1);
    if (controls.hoursPerLesson instanceof HTMLInputElement) {
      controls.hoursPerLesson.value = formatFixed(hoursPerLesson, 2);
    }
    if (controls.lessonPriceMin instanceof HTMLInputElement) {
      controls.lessonPriceMin.value =
        lessonPriceMin == null || !Number.isFinite(lessonPriceMin)
          ? ''
          : formatFixed(lessonPriceMin, 2);
    }
    if (controls.lessonPriceMax instanceof HTMLInputElement) {
      controls.lessonPriceMax.value =
        lessonPriceMax == null || !Number.isFinite(lessonPriceMax)
          ? ''
          : formatFixed(lessonPriceMax, 2);
    }
    controls.monthsOff.value = formatFixed(monthsOff, 2);
    controls.weeksOffCycle.value = formatFixed(weeksOffPerCycle, 2);
    controls.daysOffWeek.value = formatFixed(daysOffPerWeek, 2);
    controls.buffer.value = formatFixed(buffer * 100, 1);
    controls.currencySymbol.value = currencySymbol;
    if (controls.lessonCost instanceof HTMLInputElement) {
      if (Number.isFinite(lessonCostInclVat)) {
        controls.lessonCost.value = formatFixed(lessonCostInclVat, 2);
      } else if (typeof controls.lessonCost.value === 'string' && controls.lessonCost.value.trim() !== '') {
        controls.lessonCost.value = '';
      }
    }
  
    controls.workingWeeksDisplay.textContent = formatFixed(workingWeeks, 2);
    controls.workingDaysDisplay.textContent = formatFixed(workingDaysPerYear, 2);
  
    return {
      targetNet,
      targetNetPerWeek,
      targetNetPerMonth,
      targetNetAveragePerWeek,
      targetNetAveragePerMonth,
      taxRate,
      fixedCosts,
      variableCostPerClass,
      variableCostPerStudent,
      variableCostPerStudentMonthly,
      vatRate,
      classesPerWeek,
      studentsPerClass,
      hoursPerLesson,
      lessonCostInclVat,
      lessonPriceMin,
      lessonPriceMax,
      workingWeeks,
      buffer,
      bufferPercent,
      currencySymbol,
      monthsOff,
      weeksOffPerCycle,
      daysOffPerWeek,
      workingDaysPerWeek,
      workingDaysPerYear,
      activeMonths,
      activeMonthShare,
      weeksShare
    };
  }
  
  function formatCurrency(symbol, value) {
    if (!Number.isFinite(value)) {
      return `${symbol}0`;
    }
    const rounded = Math.round(value);
    const formatted = numberFormatter.format(Math.abs(rounded));
    return rounded < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }
  
  function formatCurrencyDetailed(symbol, value, digits = 2) {
    if (!Number.isFinite(value)) {
      return `${symbol}0.00`;
    }
    const absolute = Math.abs(value);
    const formatted = absolute.toLocaleString(undefined, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
    return value < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }
  
  function formatCurrencyOrDash(symbol, value, digits = 2) {
    return Number.isFinite(value) ? formatCurrencyDetailed(symbol, value, digits) : '–';
  }
  
  function formatNumberValue(value, maximumFractionDigits = 2) {
    if (!Number.isFinite(value)) {
      return '–';
    }
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits
    });
  }
  
  function escapeHtml(value) {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  function cloneInputs(inputs) {
    if (!inputs || typeof inputs !== 'object') {
      return null;
    }
    return {
      targetNet: inputs.targetNet,
      taxRate: inputs.taxRate,
      fixedCosts: inputs.fixedCosts,
      variableCostPerClass: inputs.variableCostPerClass,
      variableCostPerStudent: inputs.variableCostPerStudent,
      variableCostPerStudentMonthly: inputs.variableCostPerStudentMonthly,
      vatRate: inputs.vatRate,
      classesPerWeek: Array.isArray(inputs.classesPerWeek) ? [...inputs.classesPerWeek] : [],
      studentsPerClass: Array.isArray(inputs.studentsPerClass) ? [...inputs.studentsPerClass] : [],
      hoursPerLesson: inputs.hoursPerLesson,
      buffer: inputs.buffer,
      bufferPercent: inputs.bufferPercent,
      lessonCostInclVat: inputs.lessonCostInclVat,
      activeMonths: inputs.activeMonths,
      workingWeeks: inputs.workingWeeks,
      workingDaysPerYear: inputs.workingDaysPerYear,
      currencySymbol: inputs.currencySymbol,
      monthsOff: inputs.monthsOff,
      weeksOffPerCycle: inputs.weeksOffPerCycle,
      daysOffPerWeek: inputs.daysOffPerWeek,
      workingDaysPerWeek: inputs.workingDaysPerWeek,
      targetNetPerWeek: inputs.targetNetPerWeek,
      targetNetPerMonth: inputs.targetNetPerMonth,
      targetNetAveragePerWeek: inputs.targetNetAveragePerWeek,
      targetNetAveragePerMonth: inputs.targetNetAveragePerMonth
    };
  }
  
  function findBreakdownButton(context) {
    if (!context || !tablesContainer) {
      return null;
    }
  
    const { rowIndex, columnIndex, variant } = context;
    if (!Number.isFinite(rowIndex) || !Number.isFinite(columnIndex)) {
      return null;
    }
    const variantValue = variant === 'base' ? 'base' : 'buffered';
  
    return tablesContainer.querySelector(
      `button.price-line[data-row="${rowIndex}"][data-column="${columnIndex}"][data-variant="${variantValue}"]`
    );
  }
  
  function formatBreakdownCurrency(value) {
    return Number.isFinite(value) ? formatCurrency(latestCurrencySymbol, value) : '–';
  }
  
  function findBestPricingCombination(studentsTarget, classesPerWeekTarget, pricingData = latestPricingData) {
    if (!Array.isArray(pricingData) || !pricingData.length) {
      return null;
    }
  
    const tolerance = 1e-6;
    let bestMatch = null;
    let bestScore = Infinity;
  
    pricingData.forEach(row => {
      if (!row || !Array.isArray(row.columns)) {
        return;
      }
      const studentsValue = Number.isFinite(row.students) ? row.students : null;
      row.columns.forEach(column => {
        if (!column) {
          return;
        }
        const classesValue = Number.isFinite(column.classesPerWeek) ? column.classesPerWeek : null;
        if (studentsValue === null || classesValue === null) {
          return;
        }
        const studentDiff = Math.abs(studentsValue - studentsTarget);
        const classDiff = Math.abs(classesValue - classesPerWeekTarget);
        const score = studentDiff + classDiff / 10;
        if (score < bestScore) {
          bestScore = score;
          bestMatch = {
            row,
            column,
            studentDiff,
            classDiff
          };
        }
      });
    });
  
    if (!bestMatch) {
      return null;
    }
  
    return {
      row: bestMatch.row,
      column: bestMatch.column,
      exactStudents: bestMatch.studentDiff < tolerance,
      exactClasses: bestMatch.classDiff < tolerance
    };
  }
  
  function buildAccountingReport({
    studentsRequested,
    classesPerWeekRequested,
    hoursPerClassRequested,
    combination,
    inputs,
    currencySymbol,
    pricingMode,
    bufferPercent,
    bufferedMonthlyNet
  }) {
    if (!combination || !combination.row || !combination.column) {
      return null;
    }
  
    const { row, column, exactStudents, exactClasses } = combination;
    const breakdown = column.base && column.base.breakdown ? column.base.breakdown : null;
  
    if (!breakdown || !breakdown.perLesson || !breakdown.totals) {
      return null;
    }
  
    const totals = breakdown.totals;
    const studentsUsed = Number.isFinite(row.students) ? row.students : studentsRequested;
    const classesPerWeekUsed = Number.isFinite(column.classesPerWeek)
      ? column.classesPerWeek
      : classesPerWeekRequested;
    const workingWeeks = Number.isFinite(inputs?.workingWeeks) ? inputs.workingWeeks : 0;
    const activeMonths = Number.isFinite(inputs?.activeMonths) && inputs.activeMonths > 0
      ? inputs.activeMonths
      : MONTHS_PER_YEAR;
    const classesPerYear = Number.isFinite(column.classesPerYear)
      ? column.classesPerYear
      : classesPerWeekUsed * workingWeeks;
    const classesPerMonth = activeMonths > 0 ? classesPerYear / activeMonths : 0;
    const hoursPerClass = Number.isFinite(hoursPerClassRequested) ? hoursPerClassRequested : inputs?.hoursPerLesson;
    const weeklyHours = Number.isFinite(hoursPerClass) ? hoursPerClass * classesPerWeekUsed : null;
    const monthlyHours = Number.isFinite(hoursPerClass) ? hoursPerClass * classesPerMonth : null;
  
    const revenuePerLessonInclVat = Number.isFinite(totals.priceInclVatPerLesson)
      ? totals.priceInclVatPerLesson
      : totals.priceInclVatPerStudent * studentsUsed;
    const revenuePerLessonExVat = Number.isFinite(totals.priceExVatPerLesson)
      ? totals.priceExVatPerLesson
      : totals.priceExVatPerStudent * studentsUsed;
    const monthlyRevenueInclVat = revenuePerLessonInclVat * classesPerMonth;
    const monthlyRevenueExVat = revenuePerLessonExVat * classesPerMonth;
    const monthlyVat = monthlyRevenueInclVat - monthlyRevenueExVat;
  
    const variableCostPerClass = Number.isFinite(inputs?.variableCostPerClass)
      ? inputs.variableCostPerClass
      : 0;
    const variableCostPerStudent = Number.isFinite(inputs?.variableCostPerStudent)
      ? inputs.variableCostPerStudent
      : 0;
    const variableCostPerStudentMonthly = Number.isFinite(inputs?.variableCostPerStudentMonthly)
      ? inputs.variableCostPerStudentMonthly
      : 0;
    const monthlyVariableClass = variableCostPerClass * classesPerMonth;
    const monthlyVariableStudent = variableCostPerStudent * studentsUsed * classesPerMonth;
    const monthlyVariableStudentMonthly = variableCostPerStudentMonthly * studentsUsed;
    const monthlyVariableTotal = monthlyVariableClass + monthlyVariableStudent + monthlyVariableStudentMonthly;
    const perLessonVariableClass = variableCostPerClass;
    const perLessonVariableStudent = variableCostPerStudent * studentsUsed;
    const perLessonVariableMonthly = classesPerMonth > 0 ? monthlyVariableStudentMonthly / classesPerMonth : 0;
  
    const fixedCosts = Number.isFinite(inputs?.fixedCosts) ? inputs.fixedCosts : 0;
    const monthlyFixedCosts = activeMonths > 0 ? fixedCosts / activeMonths : 0;
    const perLessonFixed = classesPerMonth > 0 ? monthlyFixedCosts / classesPerMonth : 0;
  
    const taxRate = Number.isFinite(inputs?.taxRate) ? inputs.taxRate : 0;
    const profitBeforeTax = monthlyRevenueExVat - monthlyVariableTotal - monthlyFixedCosts;
    const monthlyIncomeTax = profitBeforeTax > 0 ? profitBeforeTax * taxRate : 0;
    const perLessonIncomeTax = classesPerMonth > 0 ? monthlyIncomeTax / classesPerMonth : 0;
    const monthlyNetIncome = profitBeforeTax - monthlyIncomeTax;
    const perLessonNetIncome = classesPerMonth > 0 ? monthlyNetIncome / classesPerMonth : 0;
  
    const perLessonVat = classesPerMonth > 0 ? monthlyVat / classesPerMonth : 0;
    const perLessonOutgoings =
      perLessonVat + perLessonVariableClass + perLessonVariableStudent + perLessonVariableMonthly + perLessonFixed + perLessonIncomeTax;
    const monthlyOutgoings =
      monthlyVat + monthlyVariableClass + monthlyVariableStudent + monthlyVariableStudentMonthly + monthlyFixedCosts + monthlyIncomeTax;
  
    const netMargin = monthlyRevenueExVat > 0 ? (monthlyNetIncome / monthlyRevenueExVat) * 100 : null;
    const effectiveHourlyNet = Number.isFinite(monthlyHours) && monthlyHours > 0
      ? monthlyNetIncome / monthlyHours
      : null;
    const effectiveHourlyGross = Number.isFinite(monthlyHours) && monthlyHours > 0
      ? monthlyRevenueInclVat / monthlyHours
      : null;
    const approxWeeksPerActiveMonth = activeMonths > 0 && Number.isFinite(workingWeeks)
      ? workingWeeks / activeMonths
      : 0;
  
    const currency = typeof currencySymbol === 'string' && currencySymbol.trim() !== ''
      ? currencySymbol
      : '€';
    const now = new Date();
    const generatedDisplay = now.toLocaleString(undefined, {
      dateStyle: 'long',
      timeStyle: 'short'
    });
  
    const notes = [];
    if (!exactStudents && Number.isFinite(studentsRequested)) {
      notes.push(
        `Requested ${formatNumberValue(studentsRequested, 2)} students; closest available combination uses ${formatNumberValue(studentsUsed, 2)}.`
      );
    }
    if (!exactClasses && Number.isFinite(classesPerWeekRequested)) {
      notes.push(
        `Requested ${formatNumberValue(classesPerWeekRequested, 2)} classes per week; closest available combination uses ${formatNumberValue(classesPerWeekUsed, 2)}.`
      );
    }
  
    if (pricingMode === PRICING_MODE_TARGET) {
      if (Number.isFinite(bufferPercent) && bufferPercent > 0 && Number.isFinite(bufferedMonthlyNet)) {
        notes.push(
          `Buffered shortfall scenario (${formatFixed(bufferPercent, 1)}% attendance loss) projects ${formatCurrencyOrDash(currency, bufferedMonthlyNet)} net per month.`
        );
      } else {
        notes.push('Report reflects the base pricing scenario that meets your net income target.');
      }
    } else {
      notes.push('Report uses the manual lesson price you entered.');
    }
  
    const notesMarkup = notes.length
      ? `<section class="report-section">
          <h2>Notes</h2>
          <ul class="report-list">${notes.map(note => `<li>${escapeHtml(note)}</li>`).join('')}</ul>
        </section>`
      : '';
  
    const summaryItems = [
      { label: 'Students per class', value: formatNumberValue(studentsUsed, 2) },
      { label: 'Classes per week', value: formatNumberValue(classesPerWeekUsed, 2) },
      { label: 'Classes per active month', value: formatNumberValue(classesPerMonth, 2) },
      { label: 'Hours per class', value: formatNumberValue(hoursPerClass, 2) },
      { label: 'Teaching hours / week', value: formatNumberValue(weeklyHours, 2) },
      { label: 'Teaching hours / month', value: formatNumberValue(monthlyHours, 2) },
      { label: 'Active months / year', value: formatNumberValue(activeMonths, 2) },
      { label: 'Working weeks / active month', value: formatNumberValue(approxWeeksPerActiveMonth, 2) },
      { label: 'VAT rate', value: `${formatFixed((inputs?.vatRate ?? 0) * 100, 1)}%` },
      { label: 'Income tax rate', value: `${formatFixed(taxRate * 100, 1)}%` }
    ];
  
    const summaryMarkup = summaryItems
      .map(item => `
        <div class="summary-item">
          <span class="summary-label">${escapeHtml(item.label)}</span>
          <span class="summary-value">${escapeHtml(item.value)}</span>
        </div>
      `)
      .join('');
  
    const currencyEscaped = escapeHtml(currency);
  
    const html = `<!DOCTYPE html>
  <html lang="en">
    <head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Monthly accounting breakdown</title>
  <style>
    :root {
      color-scheme: light;
    }
    body {
      margin: 0;
      font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
      background: #f4f6fc;
      color: #111827;
      padding: 32px 16px;
    }
    .report {
      max-width: 960px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 30px 55px rgba(15, 23, 42, 0.12);
      padding: clamp(24px, 4vw, 40px);
    }
    .report-header {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
    }
    .report-header h1 {
      margin: 0 0 8px;
      font-size: clamp(1.6rem, 2.8vw, 2.3rem);
    }
    .report-subtitle {
      margin: 0;
      color: #4b5563;
      font-size: 1rem;
    }
    .report-meta {
      min-width: 220px;
      background: #f1f5f9;
      border-radius: 16px;
      padding: 16px 18px;
      font-size: 0.95rem;
      color: #1f2937;
    }
    .report-meta p {
      margin: 0 0 6px;
    }
    .report-meta span {
      display: block;
      color: #64748b;
      font-size: 0.85rem;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 18px;
      margin-top: 20px;
    }
    .summary-item {
      background: #f8fafc;
      border-radius: 16px;
      padding: 14px 16px;
    }
    .summary-label {
      display: block;
      color: #6b7280;
      font-size: 0.85rem;
    }
    .summary-value {
      display: block;
      font-weight: 600;
      margin-top: 4px;
      font-size: 1.05rem;
    }
    .report-section {
      margin-top: 32px;
    }
    .report-section h2 {
      margin: 0 0 12px;
      font-size: 1.3rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: inset 0 0 0 1px #e2e8f0;
    }
    thead {
      background: #edf2ff;
    }
    th,
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.97rem;
    }
    th {
      text-align: left;
      font-weight: 600;
      color: #334155;
    }
    td.numeric {
      text-align: right;
      font-variant-numeric: tabular-nums;
      color: #111827;
    }
    tbody tr:last-child td,
    tbody tr:last-child th {
      border-bottom: none;
    }
    .totals-row th,
    .totals-row td {
      font-weight: 700;
      background: #f8fafc;
    }
    .report-list {
      margin: 12px 0 0;
      padding-left: 20px;
      color: #1f2937;
    }
    .report-footer {
      margin-top: 36px;
      font-size: 0.9rem;
      color: #64748b;
      text-align: right;
    }
    @media (max-width: 640px) {
      .report-meta {
        width: 100%;
      }
      table {
        font-size: 0.92rem;
      }
      th,
      td {
        padding: 10px 12px;
      }
    }
  </style>
    </head>
    <body>
  <main class="report">
    <header class="report-header">
      <div>
        <h1>Monthly accounting breakdown</h1>
        <p class="report-subtitle">${escapeHtml(
          `${formatNumberValue(studentsUsed, 2)} students · ${formatNumberValue(classesPerWeekUsed, 2)} classes per week`
        )}</p>
      </div>
      <div class="report-meta">
        <p><span>Generated</span>${escapeHtml(generatedDisplay)}</p>
        <p><span>Pricing mode</span>${escapeHtml(
          pricingMode === PRICING_MODE_TARGET ? 'Target net income (base price)' : 'Manual price per student'
        )}</p>
        <p><span>Currency</span>${currencyEscaped}</p>
      </div>
    </header>
    <section class="report-section">
      <h2>Scenario summary</h2>
      <div class="summary-grid">${summaryMarkup}</div>
    </section>
    <section class="report-section">
      <h2>Incomings</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Line item</th>
            <th scope="col" class="numeric">Per lesson</th>
            <th scope="col" class="numeric">Monthly total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Tuition revenue (incl. VAT)</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, revenuePerLessonInclVat))}</td>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyRevenueInclVat))}</td>
          </tr>
          <tr>
            <th scope="row">Tuition revenue (excl. VAT)</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, revenuePerLessonExVat))}</td>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyRevenueExVat))}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="report-section">
      <h2>Outgoings</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Line item</th>
            <th scope="col" class="numeric">Per lesson</th>
            <th scope="col" class="numeric">Monthly total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">VAT payable</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonVat))}</td>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyVat))}</td>
          </tr>
          <tr>
            <th scope="row">Variable costs – per class</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonVariableClass))}</td>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyVariableClass))}</td>
          </tr>
          <tr>
            <th scope="row">Variable costs – per student per class</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonVariableStudent))}</td>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyVariableStudent))}</td>
          </tr>
          <tr>
            <th scope="row">Variable costs – per student per month</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonVariableMonthly))}</td>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyVariableStudentMonthly))}</td>
          </tr>
          <tr>
            <th scope="row">Fixed cost allocation</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonFixed))}</td>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyFixedCosts))}</td>
          </tr>
          <tr>
            <th scope="row">Income tax provision</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonIncomeTax))}</td>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyIncomeTax))}</td>
          </tr>
          <tr class="totals-row">
            <th scope="row">Total outgoings</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonOutgoings))}</td>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyOutgoings))}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="report-section">
      <h2>Net position</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col" class="numeric">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Monthly profit before tax</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, profitBeforeTax))}</td>
          </tr>
          <tr>
            <th scope="row">Monthly net income</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyNetIncome))}</td>
          </tr>
          <tr>
            <th scope="row">Net margin (on ex-VAT revenue)</th>
            <td class="numeric">${Number.isFinite(netMargin) ? escapeHtml(`${formatFixed(netMargin, 1)}%`) : '–'}</td>
          </tr>
          <tr>
            <th scope="row">Gross hourly revenue</th>
            <td class="numeric">${Number.isFinite(effectiveHourlyGross) ? escapeHtml(formatCurrencyDetailed(currency, effectiveHourlyGross)) : '–'}</td>
          </tr>
          <tr>
            <th scope="row">Net hourly pay</th>
            <td class="numeric">${Number.isFinite(effectiveHourlyNet) ? escapeHtml(formatCurrencyDetailed(currency, effectiveHourlyNet)) : '–'}</td>
          </tr>
          <tr>
            <th scope="row">Net income per lesson</th>
            <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonNetIncome))}</td>
          </tr>
        </tbody>
      </table>
    </section>
    ${notesMarkup}
    <p class="report-footer">Generated with the Course Pricing Calculator.</p>
  </main>
    </body>
  </html>`;
  
    return html;
  }
  
  function populateBreakdownDialog(context) {
    if (
      !context ||
      !Array.isArray(latestPricingData) ||
      !breakdownDialog ||
      !breakdownSummary
    ) {
      return false;
    }
  
    const isTargetMode = latestPricingMode === PRICING_MODE_TARGET;
    const isLessonMode = latestPricingMode === PRICING_MODE_LESSON;
  
    if (!isTargetMode && !isLessonMode) {
      return false;
    }
  
    const { rowIndex, columnIndex, variant } = context;
    const row = latestPricingData[rowIndex];
    if (!row || !Array.isArray(row.columns)) {
      return false;
    }
  
    const column = row.columns[columnIndex];
    if (!column) {
      return false;
    }
  
    const pricingVariant = variant === 'base' ? column.base : column.buffered;
    if (!pricingVariant || !pricingVariant.breakdown) {
      return false;
    }
  
    const breakdown = pricingVariant.breakdown;
    const perStudentInclVat = formatCurrency(latestCurrencySymbol, pricingVariant.priceInclVat);
    const perStudentExVat = formatCurrency(latestCurrencySymbol, pricingVariant.priceExVat);
    const perLessonInclVat = formatCurrency(latestCurrencySymbol, breakdown.totals.priceInclVatPerLesson);
    const perLessonExVat = formatCurrency(latestCurrencySymbol, breakdown.totals.priceExVatPerLesson);
  
    const studentsDisplay = Number.isFinite(row.students)
      ? numberFormatter.format(row.students)
      : '–';
    const classesPerWeekValue = column.classesPerWeek;
    const classesPerWeekDisplay = Number.isFinite(classesPerWeekValue)
      ? (Number.isInteger(classesPerWeekValue)
          ? numberFormatter.format(classesPerWeekValue)
          : formatFixed(classesPerWeekValue, 2))
      : '–';
    const classesPerYearDisplay = Number.isFinite(column.classesPerYear)
      ? numberFormatter.format(Math.round(column.classesPerYear))
      : '–';
  
    let variantLabel;
    if (isLessonMode) {
      variantLabel = variant === 'base'
        ? 'Full attendance at set lesson price'
        : `Attendance shortfall (${formatFixed(latestBufferPercent, 1)}% less revenue)`;
    } else {
      variantLabel = variant === 'base'
        ? 'Base price (no buffer)'
        : `Buffered price (+${formatFixed(latestBufferPercent, 1)}% extra safety margin)`;
    }
  
    if (breakdownVariant) {
      breakdownVariant.textContent = variantLabel;
    }
  
    if (breakdownPrice) {
      breakdownPrice.textContent = `${perStudentInclVat} per student (${perStudentExVat} ex VAT)`;
    }
  
    if (breakdownMeta) {
      breakdownMeta.textContent = `${studentsDisplay} students · ${classesPerWeekDisplay} classes/week (≈ ${classesPerYearDisplay} / yr)`;
    }
  
    if (breakdownTotal) {
      breakdownTotal.textContent = `Total collected per lesson: ${perLessonInclVat} (${perLessonExVat} ex VAT)`;
    }
  
    const tableRows = [
      { key: 'vat', label: 'VAT remitted' },
      { key: 'variableCosts', label: 'Variable costs' },
      { key: 'fixedCostAllocation', label: 'Fixed cost allocation' },
      { key: 'incomeTax', label: 'Income tax' },
      { key: 'netIncome', label: 'Net income after tax' }
    ];
  
    if (breakdownTableBody) {
      const rowsMarkup = tableRows
        .map(item => {
          const perStudentValue = breakdown.perStudent[item.key];
          const perLessonValue = breakdown.perLesson[item.key];
          return `
            <tr>
              <th scope="row">${item.label}</th>
              <td>${formatBreakdownCurrency(perStudentValue)}</td>
              <td>${formatBreakdownCurrency(perLessonValue)}</td>
            </tr>
          `;
        })
        .join('');
      breakdownTableBody.innerHTML = rowsMarkup;
    }
  
    const legendItems = [
      { key: 'vat', label: 'VAT remitted', value: breakdown.perLesson.vat, color: 'var(--breakdown-color-vat)' },
      { key: 'variableCosts', label: 'Variable costs', value: breakdown.perLesson.variableCosts, color: 'var(--breakdown-color-variable)' },
      { key: 'fixedCostAllocation', label: 'Fixed cost allocation', value: breakdown.perLesson.fixedCostAllocation, color: 'var(--breakdown-color-fixed)' },
      { key: 'incomeTax', label: 'Income tax', value: breakdown.perLesson.incomeTax, color: 'var(--breakdown-color-tax)' },
      { key: 'netIncome', label: 'Net income after tax', value: breakdown.perLesson.netIncome, color: 'var(--breakdown-color-net)' }
    ];
  
    if (breakdownLegend) {
      const legendMarkup = legendItems
        .map(item => `
          <li class="lesson-breakdown-dialog__legend-item">
            <span class="lesson-breakdown-dialog__legend-swatch" style="--swatch-color:${item.color};"></span>
            <span class="lesson-breakdown-dialog__legend-label">${item.label}</span>
            <span class="lesson-breakdown-dialog__legend-value">${formatBreakdownCurrency(item.value)}</span>
          </li>
        `)
        .join('');
      breakdownLegend.innerHTML = legendMarkup;
    }
  
    if (breakdownChartGraphic) {
      const positiveSegments = legendItems.map(item => Math.max(item.value, 0));
      const total = positiveSegments.reduce((sum, value) => sum + value, 0);
  
      if (total > 0) {
        let currentAngle = 0;
        const segments = legendItems
          .map((item, index) => {
            const value = positiveSegments[index];
            if (value <= 0) {
              return null;
            }
            const start = currentAngle;
            const end = start + (value / total) * 360;
            currentAngle = end;
            return `${item.color} ${start}deg ${end}deg`;
          })
          .filter(Boolean);
  
        breakdownChartGraphic.style.background = segments.length
          ? `conic-gradient(${segments.join(', ')})`
          : 'radial-gradient(circle at 50% 50%, var(--price-line-bg), var(--row-header-bg))';
      } else {
        breakdownChartGraphic.style.background = 'radial-gradient(circle at 50% 50%, var(--price-line-bg), var(--row-header-bg))';
      }
  
    }
  
    return true;
  }
  
  function openBreakdownDialog(context, triggerElement) {
    if (!breakdownDialog) {
      return;
    }
  
    const normalizedContext = {
      rowIndex: Number(context?.rowIndex),
      columnIndex: Number(context?.columnIndex),
      variant: context?.variant === 'base' ? 'base' : 'buffered'
    };
  
    if (!populateBreakdownDialog(normalizedContext)) {
      return;
    }
  
    activeBreakdownContext = normalizedContext;
    breakdownTriggerElement = triggerElement instanceof HTMLElement ? triggerElement : null;
    breakdownDialog.hidden = false;
    breakdownDialog.scrollTop = 0;
    setBodyScrollLock('breakdown', true);
  
    window.requestAnimationFrame(() => {
      const focusable = getFocusableElements(breakdownDialog);
      if (focusable.length) {
        focusable[0].focus();
      } else if (breakdownClose) {
        breakdownClose.focus();
      }
    });
  
    document.addEventListener('keydown', handleBreakdownKeydown);
  }
  
  function closeBreakdownDialog() {
    if (!breakdownDialog || breakdownDialog.hidden) {
      return;
    }
  
    breakdownDialog.hidden = true;
    setBodyScrollLock('breakdown', false);
    document.removeEventListener('keydown', handleBreakdownKeydown);
  
    const trigger = breakdownTriggerElement;
    breakdownTriggerElement = null;
    activeBreakdownContext = null;
  
    if (trigger instanceof HTMLElement && trigger.isConnected && typeof trigger.focus === 'function') {
      trigger.focus();
    }
  }
  
  function handleBreakdownKeydown(event) {
    if (!breakdownDialog || breakdownDialog.hidden) {
      return;
    }
  
    if (event.key === 'Escape') {
      event.preventDefault();
      closeBreakdownDialog();
      return;
    }
  
    if (event.key === 'Tab') {
      const focusable = getFocusableElements(breakdownDialog);
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
  
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
  
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    }
  }
  
  function refreshBreakdownDialog() {
    if (!breakdownDialog || breakdownDialog.hidden || !activeBreakdownContext) {
      return false;
    }
  
    const refreshed = populateBreakdownDialog(activeBreakdownContext);
    if (refreshed) {
      const updatedTrigger = findBreakdownButton(activeBreakdownContext);
      if (updatedTrigger) {
        breakdownTriggerElement = updatedTrigger;
      }
    }
  
    return refreshed;
  }
  
  function computeNetIncomeFromRevenue(revenue, fixedCosts, effectiveTaxRate, variableCosts = 0) {
    if (!Number.isFinite(revenue)) {
      return null;
    }
    const normalizedVariableCosts = Number.isFinite(variableCosts) ? variableCosts : 0;
    const profitBeforeTax = revenue - fixedCosts - normalizedVariableCosts;
    return profitBeforeTax * (1 - effectiveTaxRate);
  }
  
  function shouldHighlightIncome({ monthlyNet, annualNet }, options = {}) {
    const {
      acceptableIncome = null,
      displayMode = 'net',
      taxRate = 0,
      activeMonths = MONTHS_PER_YEAR
    } = options;
  
    if (!acceptableIncome || typeof acceptableIncome !== 'object') {
      return false;
    }
  
    const { basis, minAnnualNet, maxAnnualNet } = acceptableIncome;
    const hasMin = Number.isFinite(minAnnualNet);
    const hasMax = Number.isFinite(maxAnnualNet);
  
    if (!basis || (!hasMin && !hasMax)) {
      return false;
    }
  
    const normalizedTaxRate = Math.min(Math.max(taxRate, 0), 0.9999);
    const denominator = Math.max(1 - normalizedTaxRate, 0.0001);
    const monthsForRange = activeMonths > 0 ? activeMonths : MONTHS_PER_YEAR;
  
    const convertNetToDisplay = value => {
      if (!Number.isFinite(value)) {
        return null;
      }
      return displayMode === 'gross' ? value / denominator : value;
    };
  
    if (basis === 'annual') {
      if (!Number.isFinite(annualNet)) {
        return false;
      }
      const valueDisplay = convertNetToDisplay(annualNet);
      const minDisplay = hasMin ? convertNetToDisplay(minAnnualNet) : null;
      const maxDisplay = hasMax ? convertNetToDisplay(maxAnnualNet) : null;
      if (!Number.isFinite(valueDisplay)) {
        return false;
      }
      if (Number.isFinite(minDisplay) && valueDisplay < minDisplay) {
        return false;
      }
      if (Number.isFinite(maxDisplay) && valueDisplay > maxDisplay) {
        return false;
      }
      return true;
    }
  
    if (!Number.isFinite(monthlyNet)) {
      return false;
    }
    const valueDisplay = convertNetToDisplay(monthlyNet);
    const minDisplay = hasMin ? convertNetToDisplay(minAnnualNet / monthsForRange) : null;
    const maxDisplay = hasMax ? convertNetToDisplay(maxAnnualNet / monthsForRange) : null;
    if (!Number.isFinite(valueDisplay)) {
      return false;
    }
    if (Number.isFinite(minDisplay) && valueDisplay < minDisplay) {
      return false;
    }
    if (Number.isFinite(maxDisplay) && valueDisplay > maxDisplay) {
      return false;
    }
    return true;
  }
  
  function buildPricingTable(data, symbol, bufferPercent, options = {}) {
    if (!data.length) {
      return `<div class="card"><p class="status-message">No valid combinations available.</p></div>`;
    }
  
    const {
      mode = PRICING_MODE_TARGET,
      showBasePrices: showBase = false,
      minLessonPrice = null,
      maxLessonPrice = null,
      acceptableIncome: acceptableIncomeRange = null,
      desiredIncomeDisplayMode: incomeDisplayMode = 'net',
      taxRate: incomeTaxRate = 0,
      activeMonths: incomeActiveMonths = MONTHS_PER_YEAR,
      hoursPerLesson: lessonHours = 1
    } = options;
    const formattedBuffer = formatFixed(bufferPercent, 1);
    const showBasePricesActive = mode === PRICING_MODE_TARGET && showBase;
    const cardClasses = ['card', 'pricing-card'];
    if (showBasePricesActive) {
      cardClasses.push('show-base-prices');
    }
  
    const hasPreferredRange =
      Number.isFinite(minLessonPrice) || Number.isFinite(maxLessonPrice);
  
    const convertNetIncomeForDisplay = value => {
      if (!Number.isFinite(value)) {
        return null;
      }
      return incomeDisplayMode === 'gross'
        ? convertNetToGross(value, incomeTaxRate)
        : value;
    };
  
    const formatIncomeForDisplay = value => {
      const converted = convertNetIncomeForDisplay(value);
      return Number.isFinite(converted) ? formatCurrency(symbol, converted) : '–';
    };
  
    const monthlyIncomeLabel = incomeDisplayMode === 'gross' ? 'Monthly gross' : 'Monthly net';
    const annualIncomeLabel = incomeDisplayMode === 'gross' ? 'Annual gross' : 'Annual net';
  
    const isPriceOutOfRange = value => {
      if (!hasPreferredRange || !Number.isFinite(value)) {
        return false;
      }
      if (Number.isFinite(minLessonPrice) && value < minLessonPrice) {
        return true;
      }
      if (Number.isFinite(maxLessonPrice) && value > maxLessonPrice) {
        return true;
      }
      return false;
    };
  
    const normalizedLessonHours = Number.isFinite(lessonHours) && lessonHours > 0 ? lessonHours : null;
    const hourlyRateLabel = incomeDisplayMode === 'gross' ? 'Hourly gross' : 'Hourly net';
  
    const computeHourlyRate = breakdown => {
      if (!normalizedLessonHours) {
        return null;
      }
      const netPerLesson = breakdown?.perLesson?.netIncome;
      if (!Number.isFinite(netPerLesson)) {
        return null;
      }
      const lessonValue = incomeDisplayMode === 'gross'
        ? convertNetToGross(netPerLesson, incomeTaxRate)
        : netPerLesson;
      if (!Number.isFinite(lessonValue)) {
        return null;
      }
      const perHour = lessonValue / normalizedLessonHours;
      return Number.isFinite(perHour) ? perHour : null;
    };
  
    const formatHourlyRateDisplay = breakdown => {
      const rate = computeHourlyRate(breakdown);
      return Number.isFinite(rate) ? formatCurrency(symbol, rate) : '–';
    };
  
    const toggleMarkup = mode === PRICING_MODE_TARGET
      ? `<div class="price-toggle-row">
          <button type="button" class="price-reveal-toggle secondary" aria-expanded="${showBasePricesActive}">
            ${showBasePricesActive ? 'Hide base price' : 'Show base price'}
          </button>
        </div>`
      : '';
  
    const columnHeaders = data[0].columns
      .map(col => {
        return `<th scope="col">${col.classesPerWeek}/week<span class="sub-label">≈ ${numberFormatter.format(col.classesPerYear)} / yr</span></th>`;
      })
      .join('');
  
    const rowsHtml = data
      .map((row, rowIndex) => {
        const cells = row.columns
          .map((col, columnIndex) => {
            if (mode === PRICING_MODE_LESSON && col.manualNet) {
              const monthlyDisplay = formatIncomeForDisplay(col.manualNet.monthly);
              const annualDisplay = formatIncomeForDisplay(col.manualNet.annual);
              const bufferedMonthlyDisplay = formatIncomeForDisplay(col.manualNet.bufferedMonthly);
              const bufferedAnnualDisplay = formatIncomeForDisplay(col.manualNet.bufferedAnnual);
              const bufferedHourlyDisplay = formatHourlyRateDisplay(col.buffered.breakdown);
              const baseHourlyDisplay = formatHourlyRateDisplay(col.base.breakdown);
  
              const highlightBase = shouldHighlightIncome(
                { monthlyNet: col.manualNet.monthly, annualNet: col.manualNet.annual },
                {
                  acceptableIncome: acceptableIncomeRange,
                  displayMode: incomeDisplayMode,
                  taxRate: incomeTaxRate,
                  activeMonths: incomeActiveMonths
                }
              );
              const highlightBuffered = shouldHighlightIncome(
                {
                  monthlyNet: col.manualNet.bufferedMonthly,
                  annualNet: col.manualNet.bufferedAnnual
                },
                {
                  acceptableIncome: acceptableIncomeRange,
                  displayMode: incomeDisplayMode,
                  taxRate: incomeTaxRate,
                  activeMonths: incomeActiveMonths
                }
              );
  
              const baseButtonClass = highlightBase ? 'price-line price-line--acceptable' : 'price-line';
              const bufferedButtonClass = highlightBuffered
                ? 'price-line buffered price-line--acceptable'
                : 'price-line buffered';
  
              return `
              <td>
                <div class="price-pair">
                  <button
                    type="button"
                    class="${baseButtonClass}"
                    data-row="${rowIndex}"
                    data-column="${columnIndex}"
                    data-variant="base"
                  >
                    <span class="price-label">${monthlyIncomeLabel}</span>
                    <strong>${monthlyDisplay}</strong>
                    <span class="price-secondary">${annualIncomeLabel} ${annualDisplay}</span>
                    <span class="price-tertiary">${hourlyRateLabel} ${baseHourlyDisplay}</span>
                  </button>
                  <button
                    type="button"
                    class="${bufferedButtonClass}"
                    data-row="${rowIndex}"
                    data-column="${columnIndex}"
                    data-variant="buffered"
                  >
                    <span class="price-label">${monthlyIncomeLabel} with ${formattedBuffer}% shortfall</span>
                    <strong>${bufferedMonthlyDisplay}</strong>
                    <span class="price-secondary">${annualIncomeLabel} ${bufferedAnnualDisplay}</span>
                    <span class="price-tertiary">${hourlyRateLabel} ${bufferedHourlyDisplay}</span>
                  </button>
                </div>
              </td>
            `;
            }
  
            const bufferedExVat = formatCurrency(symbol, col.buffered.priceExVat);
            const bufferedInclVat = formatCurrency(symbol, col.buffered.priceInclVat);
            const baseExVat = formatCurrency(symbol, col.base.priceExVat);
            const baseInclVat = formatCurrency(symbol, col.base.priceInclVat);
            const bufferedOutOfRange = isPriceOutOfRange(col.buffered.priceInclVat);
            const baseOutOfRange = isPriceOutOfRange(col.base.priceInclVat);
            const highlightBaseIncome = shouldHighlightIncome(
              { monthlyNet: col.base.monthlyNet, annualNet: col.base.annualNet },
              {
                acceptableIncome: acceptableIncomeRange,
                displayMode: incomeDisplayMode,
                taxRate: incomeTaxRate,
                activeMonths: incomeActiveMonths
              }
            );
            const highlightBufferedIncome = shouldHighlightIncome(
              { monthlyNet: col.buffered.monthlyNet, annualNet: col.buffered.annualNet },
              {
                acceptableIncome: acceptableIncomeRange,
                displayMode: incomeDisplayMode,
                taxRate: incomeTaxRate,
                activeMonths: incomeActiveMonths
              }
            );
            const bufferedClasses = ['price-line', 'buffered'];
            if (bufferedOutOfRange) {
              bufferedClasses.push('price-line--out-of-range');
            }
            if (highlightBufferedIncome) {
              bufferedClasses.push('price-line--acceptable');
            }
            const baseClasses = ['price-line', 'base'];
            if (baseOutOfRange) {
              baseClasses.push('price-line--out-of-range');
            }
            if (highlightBaseIncome) {
              baseClasses.push('price-line--acceptable');
            }
            const bufferedButtonClass = bufferedClasses.join(' ');
            const baseButtonClass = baseClasses.join(' ');
            const bufferedAnnualIncomeDisplay = formatIncomeForDisplay(col.buffered.annualNet);
            const baseAnnualIncomeDisplay = formatIncomeForDisplay(col.base.annualNet);
            const bufferedHourlyDisplay = formatHourlyRateDisplay(col.buffered.breakdown);
            const baseHourlyDisplay = formatHourlyRateDisplay(col.base.breakdown);
            const bufferedValueClass = bufferedOutOfRange
              ? 'price-value price-value--out-of-range'
              : 'price-value';
            const baseValueClass = baseOutOfRange
              ? 'price-value price-value--out-of-range'
              : 'price-value';
            return `
              <td>
                <button
                  type="button"
                  class="${bufferedButtonClass}"
                  data-row="${rowIndex}"
                  data-column="${columnIndex}"
                  data-variant="buffered"
                >
                  <span class="price-label">Buffered +${formattedBuffer}%</span>
                  <strong class="${bufferedValueClass}">${bufferedInclVat}</strong>
                  <span class="price-secondary">${annualIncomeLabel} ${bufferedAnnualIncomeDisplay}</span>
                  <span class="price-secondary">ex VAT ${bufferedExVat}</span>
                  <span class="price-tertiary">${hourlyRateLabel} ${bufferedHourlyDisplay}</span>
                </button>
                <button
                  type="button"
                  class="${baseButtonClass}"
                  aria-hidden="${showBasePricesActive ? 'false' : 'true'}"
                  data-row="${rowIndex}"
                  data-column="${columnIndex}"
                  data-variant="base"
                >
                  <span class="price-label">Base (no buffer)</span>
                  <strong class="${baseValueClass}">${baseInclVat}</strong>
                  <span class="price-secondary">${annualIncomeLabel} ${baseAnnualIncomeDisplay}</span>
                  <span class="price-secondary">ex VAT ${baseExVat}</span>
                  <span class="price-tertiary">${hourlyRateLabel} ${baseHourlyDisplay}</span>
                </button>
              </td>
            `;
          })
          .join('');
        return `<tr><th scope="row">${row.students}<span class="sub-label">students</span></th>${cells}</tr>`;
      })
      .join('');
  
    return `
      <div class="${cardClasses.join(' ')}">
        ${toggleMarkup}
        <div class="card-scroll">
          <table>
            <caption>Per-student pricing (includes optional extra safety margin)</caption>
            <thead>
              <tr>
                <th scope="col">Students / class</th>
                ${columnHeaders}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  function buildActiveTargetsTable({
    currencySymbol,
    revenueNeeded,
    workingDaysPerYear,
    workingWeeks,
    activeMonths
  }) {
    if (!Number.isFinite(revenueNeeded) || revenueNeeded <= 0) {
      return '';
    }
  
    const targets = [
      {
        label: 'Active day',
        basis: workingDaysPerYear,
        suffix: 'active days / year'
      },
      {
        label: 'Active week',
        basis: workingWeeks,
        suffix: 'active weeks / year'
      },
      {
        label: 'Active month',
        basis: activeMonths,
        suffix: 'active months / year'
      }
    ];
  
    const rows = targets
      .map(target => {
        const hasBasis = Number.isFinite(target.basis) && target.basis > 0;
        const amount = hasBasis ? revenueNeeded / target.basis : null;
        const amountDisplay = hasBasis && Number.isFinite(amount)
          ? formatCurrency(currencySymbol, amount)
          : '–';
        const basisDisplay = hasBasis
          ? `Based on ≈ ${formatFixed(target.basis, 2)} ${target.suffix}`
          : '–';
  
        return `
          <tr>
            <th scope="row">${target.label}</th>
            <td>${amountDisplay}</td>
            <td>${basisDisplay}</td>
          </tr>
        `;
      })
      .join('');
  
    return `
      <div class="card">
        <div class="card-scroll">
          <table>
            <caption>
              Gross Revenue Needed To Achieve Net Income Targets
              <span
                class="info-icon"
                tabindex="0"
                role="button"
                aria-expanded="false"
                aria-label="“Active” periods exclude the time you planned off (months, weeks, and days away from teaching)."
                data-tooltip="“Active” periods exclude the time you planned off (months, weeks, and days away from teaching)."
              >ℹ️</span>
            </caption>
            <thead>
              <tr>
                <th scope="col">Target</th>
                <th scope="col">Revenue needed</th>
                <th scope="col">Basis</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
  
  function computeTables(inputs) {
    const {
      targetNet,
      taxRate,
      fixedCosts,
      variableCostPerClass,
      variableCostPerStudent,
      variableCostPerStudentMonthly,
      vatRate,
      classesPerWeek,
      studentsPerClass,
      hoursPerLesson,
      workingWeeks,
      buffer,
      bufferPercent,
      lessonCostInclVat,
      activeMonths
    } = inputs;
  
    latestResults = [];
  
    const manualMode = Number.isFinite(lessonCostInclVat);
    const mode = manualMode ? PRICING_MODE_LESSON : PRICING_MODE_TARGET;
  
    const pricingData = [];
    const effectiveTaxRate = Math.min(taxRate, 0.99);
    const hasSchedule =
      classesPerWeek.length &&
      studentsPerClass.length &&
      Number.isFinite(workingWeeks) &&
      workingWeeks > 0;
  
    const hasWorkingWeeks = Number.isFinite(workingWeeks) && workingWeeks > 0;
    const hasActiveMonths = Number.isFinite(activeMonths) && activeMonths > 0;
  
    let manualNetSummary = null;
    let revenueNeeded = null;
  
    if (!hasSchedule) {
      latestResultsMode = mode;
      return { pricingData, bufferPercent, revenueNeeded, mode, manualNetSummary };
    }
  
    const sortedStudents = [...studentsPerClass];
    sortedStudents.sort((a, b) => a - b);
  
    const normalizedActiveMonths = Number.isFinite(activeMonths) && activeMonths > 0 ? activeMonths : 0;
  
    const columnsMeta = classesPerWeek.map(classes => {
      const classesPerYear = classes * workingWeeks;
      return { classesPerWeek: classes, classesPerYear };
    });
  
    function buildPriceBreakdown({ priceExVatValue, priceInclVatValue, studentCount, classesPerYearValue }) {
      const normalizedPriceExVat = Number.isFinite(priceExVatValue) ? priceExVatValue : 0;
      const normalizedPriceInclVat = Number.isFinite(priceInclVatValue) ? priceInclVatValue : 0;
      const actualStudents = Number.isFinite(studentCount) ? studentCount : 0;
      const actualClassesPerYear = Number.isFinite(classesPerYearValue) ? classesPerYearValue : 0;
      const safeStudents = actualStudents > 0 ? actualStudents : 1;
      const fixedAllocationPerLesson = actualClassesPerYear > 0 ? fixedCosts / actualClassesPerYear : 0;
      const vatPerStudent = normalizedPriceInclVat - normalizedPriceExVat;
      const vatPerLesson = vatPerStudent * actualStudents;
      const monthlyCostTotal = variableCostPerStudentMonthly * actualStudents * normalizedActiveMonths;
      const monthlyCostPerLesson = actualClassesPerYear > 0 ? monthlyCostTotal / actualClassesPerYear : 0;
      const variableCostsPerLesson =
        variableCostPerClass + variableCostPerStudent * actualStudents + monthlyCostPerLesson;
      const revenueExVatPerLesson = normalizedPriceExVat * actualStudents;
      const profitBeforeTaxPerLesson = revenueExVatPerLesson - variableCostsPerLesson - fixedAllocationPerLesson;
      const incomeTaxPerLesson = profitBeforeTaxPerLesson > 0 ? profitBeforeTaxPerLesson * effectiveTaxRate : 0;
      const netIncomePerLesson = profitBeforeTaxPerLesson - incomeTaxPerLesson;
  
      return {
        perLesson: {
          vat: vatPerLesson,
          variableCosts: variableCostsPerLesson,
          fixedCostAllocation: fixedAllocationPerLesson,
          incomeTax: incomeTaxPerLesson,
          netIncome: netIncomePerLesson
        },
        perStudent: {
          vat: vatPerStudent,
          variableCosts: variableCostsPerLesson / safeStudents,
          fixedCostAllocation: fixedAllocationPerLesson / safeStudents,
          incomeTax: incomeTaxPerLesson / safeStudents,
          netIncome: netIncomePerLesson / safeStudents
        },
        totals: {
          priceInclVatPerStudent: normalizedPriceInclVat,
          priceExVatPerStudent: normalizedPriceExVat,
          priceInclVatPerLesson: normalizedPriceInclVat * actualStudents,
          priceExVatPerLesson: revenueExVatPerLesson,
          students: actualStudents,
          classesPerYear: actualClassesPerYear
        }
      };
    }
  
    if (mode === PRICING_MODE_LESSON) {
      const vatDivisor = Math.max(1 + vatRate, 0.0001);
      const priceInclVatPerStudent = lessonCostInclVat;
      const priceExVatPerStudent = lessonCostInclVat / vatDivisor;
      const attendanceMultiplier = Math.max(1 - buffer, 0);
      const formattedBuffer = formatFixed(bufferPercent, 1);
  
      for (const students of sortedStudents) {
        const row = { students, columns: [] };
  
        for (const column of columnsMeta) {
          const classesPerYear = column.classesPerYear;
          const annualRevenue = priceExVatPerStudent * students * classesPerYear;
          const bufferedRevenue = annualRevenue * attendanceMultiplier;
          const annualVariableCosts =
            variableCostPerClass * classesPerYear +
            variableCostPerStudent * students * classesPerYear +
            variableCostPerStudentMonthly * students * normalizedActiveMonths;
  
          const annualNet = computeNetIncomeFromRevenue(
            annualRevenue,
            fixedCosts,
            effectiveTaxRate,
            annualVariableCosts
          );
          const bufferedAnnualNet = computeNetIncomeFromRevenue(
            bufferedRevenue,
            fixedCosts,
            effectiveTaxRate,
            annualVariableCosts
          );
  
          const monthlyNet = Number.isFinite(annualNet) && hasActiveMonths
            ? annualNet / activeMonths
            : null;
          const bufferedMonthlyNet = Number.isFinite(bufferedAnnualNet) && hasActiveMonths
            ? bufferedAnnualNet / activeMonths
            : null;
  
          if (!manualNetSummary && Number.isFinite(annualNet)) {
            manualNetSummary = {
              annual: annualNet,
              monthly: Number.isFinite(monthlyNet) ? monthlyNet : null,
              weekly: hasWorkingWeeks ? annualNet / workingWeeks : null,
              averageWeekly: annualNet / WEEKS_PER_YEAR,
              averageMonthly: annualNet / MONTHS_PER_YEAR
            };
          }
  
          const baseBreakdown = buildPriceBreakdown({
            priceExVatValue: priceExVatPerStudent,
            priceInclVatValue: priceInclVatPerStudent,
            studentCount: students,
            classesPerYearValue: classesPerYear
          });
  
          row.columns.push({
            classesPerWeek: column.classesPerWeek,
            classesPerYear,
            manualNet: {
              monthly: monthlyNet,
              annual: annualNet,
              bufferedMonthly: bufferedMonthlyNet,
              bufferedAnnual: bufferedAnnualNet
            },
            base: {
              priceExVat: priceExVatPerStudent,
              priceInclVat: priceInclVatPerStudent,
              breakdown: baseBreakdown
            },
            buffered: {
              priceExVat: priceExVatPerStudent,
              priceInclVat: priceInclVatPerStudent,
              breakdown: baseBreakdown
            }
          });
  
          latestResults.push({
            variant: 'Full attendance',
            students,
            classesPerWeek: column.classesPerWeek,
            classesPerYear: Math.round(classesPerYear),
            monthlyNet,
            annualNet
          });
          latestResults.push({
            variant: `With ${formattedBuffer}% shortfall`,
            students,
            classesPerWeek: column.classesPerWeek,
            classesPerYear: Math.round(classesPerYear),
            monthlyNet: bufferedMonthlyNet,
            annualNet: bufferedAnnualNet
          });
        }
  
        pricingData.push(row);
      }
  
      latestResultsMode = mode;
      return { pricingData, bufferPercent, revenueNeeded, mode, manualNetSummary };
    }
  
    const denominator = Math.max(1 - effectiveTaxRate, 0.0001);
    const profitBeforeTax = targetNet / denominator;
    revenueNeeded = profitBeforeTax + fixedCosts;
  
    if (!Number.isFinite(revenueNeeded) || revenueNeeded <= 0) {
      latestResultsMode = mode;
      return { pricingData, bufferPercent, revenueNeeded, mode, manualNetSummary };
    }
  
    for (const students of sortedStudents) {
      const row = { students, columns: [] };
  
      for (const column of columnsMeta) {
        const classesPerYear = column.classesPerYear;
        const effectiveClassesPerYear = Math.max(classesPerYear, 1);
        const annualVariableCosts =
          variableCostPerClass * classesPerYear +
          variableCostPerStudent * students * classesPerYear +
          variableCostPerStudentMonthly * students * normalizedActiveMonths;
        const revenueNeededForCombo = revenueNeeded + annualVariableCosts;
        const revenuePerClass = revenueNeededForCombo / effectiveClassesPerYear;
        const priceExVat = revenuePerClass / Math.max(students, 1);
        const bufferedExVat = priceExVat * (1 + buffer);
        const priceInclVat = priceExVat * (1 + vatRate);
        const bufferedInclVat = bufferedExVat * (1 + vatRate);
  
        const roundedBaseExVat = Math.round(priceExVat);
        const roundedBaseInclVat = Math.round(priceInclVat);
        const roundedBufferedExVat = Math.round(bufferedExVat);
        const roundedBufferedInclVat = Math.round(bufferedInclVat);
  
        const baseBreakdown = buildPriceBreakdown({
          priceExVatValue: priceExVat,
          priceInclVatValue: priceInclVat,
          studentCount: students,
          classesPerYearValue: classesPerYear
        });
        const bufferedBreakdown = buildPriceBreakdown({
          priceExVatValue: bufferedExVat,
          priceInclVatValue: bufferedInclVat,
          studentCount: students,
          classesPerYearValue: classesPerYear
        });
  
        const baseAnnualNet = Number.isFinite(baseBreakdown?.perLesson?.netIncome)
          ? baseBreakdown.perLesson.netIncome * classesPerYear
          : null;
        const bufferedAnnualNet = Number.isFinite(bufferedBreakdown?.perLesson?.netIncome)
          ? bufferedBreakdown.perLesson.netIncome * classesPerYear
          : null;
        const baseMonthlyNet = Number.isFinite(baseAnnualNet) && hasActiveMonths
          ? baseAnnualNet / activeMonths
          : null;
        const bufferedMonthlyNet = Number.isFinite(bufferedAnnualNet) && hasActiveMonths
          ? bufferedAnnualNet / activeMonths
          : null;
  
        row.columns.push({
          classesPerWeek: column.classesPerWeek,
          classesPerYear,
          base: {
            priceExVat,
            priceInclVat,
            breakdown: baseBreakdown,
            annualNet: baseAnnualNet,
            monthlyNet: baseMonthlyNet
          },
          buffered: {
            priceExVat: bufferedExVat,
            priceInclVat: bufferedInclVat,
            breakdown: bufferedBreakdown,
            annualNet: bufferedAnnualNet,
            monthlyNet: bufferedMonthlyNet
          }
        });
  
        latestResults.push({
          variant: 'Base (no buffer)',
          students,
          classesPerWeek: column.classesPerWeek,
          classesPerYear: Math.round(classesPerYear),
          priceExVat: roundedBaseExVat,
          priceInclVat: roundedBaseInclVat
        });
  
        latestResults.push({
          variant: `Buffered +${bufferPercent}%`,
          students,
          classesPerWeek: column.classesPerWeek,
          classesPerYear: Math.round(classesPerYear),
          priceExVat: roundedBufferedExVat,
          priceInclVat: roundedBufferedInclVat
        });
      }
  
      pricingData.push(row);
    }
  
    latestResultsMode = mode;
    return { pricingData, bufferPercent, revenueNeeded, mode, manualNetSummary };
  }
  
  function render() {
    const inputs = getInputs();
    latestInputsSnapshot = cloneInputs(inputs);
    const { pricingData, bufferPercent, revenueNeeded, mode, manualNetSummary } = computeTables(inputs);
  
    if (mode === PRICING_MODE_LESSON && manualNetSummary) {
      if (Number.isFinite(manualNetSummary.annual)) {
        writeDesiredIncomeNet('year', Math.max(manualNetSummary.annual, 0));
        inputs.targetNet = manualNetSummary.annual;
      }
  
      if (Number.isFinite(manualNetSummary.weekly)) {
        writeDesiredIncomeNet('week', Math.max(manualNetSummary.weekly, 0));
        inputs.targetNetPerWeek = manualNetSummary.weekly;
      } else {
        writeDesiredIncomeNet('week', null);
        inputs.targetNetPerWeek = null;
      }
  
      if (Number.isFinite(manualNetSummary.monthly)) {
        writeDesiredIncomeNet('month', Math.max(manualNetSummary.monthly, 0));
        inputs.targetNetPerMonth = manualNetSummary.monthly;
      } else {
        writeDesiredIncomeNet('month', null);
        inputs.targetNetPerMonth = null;
      }
  
      if (Number.isFinite(manualNetSummary.averageWeekly)) {
        writeDesiredIncomeNet('avgWeek', Math.max(manualNetSummary.averageWeekly, 0));
        inputs.targetNetAveragePerWeek = manualNetSummary.averageWeekly;
      } else {
        writeDesiredIncomeNet('avgWeek', null);
        inputs.targetNetAveragePerWeek = null;
      }
  
      if (Number.isFinite(manualNetSummary.averageMonthly)) {
        writeDesiredIncomeNet('avgMonth', Math.max(manualNetSummary.averageMonthly, 0));
        inputs.targetNetAveragePerMonth = manualNetSummary.averageMonthly;
      } else {
        writeDesiredIncomeNet('avgMonth', null);
        inputs.targetNetAveragePerMonth = null;
      }
  
      refreshDesiredIncomeDisplay(
        {
          year: manualNetSummary.annual,
          week: manualNetSummary.weekly,
          month: manualNetSummary.monthly,
          avgWeek: manualNetSummary.averageWeekly,
          avgMonth: manualNetSummary.averageMonthly
        },
        inputs.taxRate
      );
      refreshAcceptableIncomeDisplay(inputs.taxRate, { force: true });
    }
  
    latestCurrencySymbol = inputs.currencySymbol;
    latestPricingMode = mode;
    latestBufferPercent = bufferPercent;
    latestPricingData = pricingData.length ? pricingData : null;
  
    closeActiveInfoIcon();
  
    if (!pricingData.length) {
      tablesContainer.innerHTML = `
        <div class="card">
          <p class="status-message">Enter at least one valid class count and student count to see the pricing table.</p>
        </div>
      `;
      scheduleTablesLayoutUpdate();
    } else {
      const pricingTable = buildPricingTable(pricingData, inputs.currencySymbol, bufferPercent, {
        mode,
        showBasePrices,
        minLessonPrice: inputs.lessonPriceMin,
        maxLessonPrice: inputs.lessonPriceMax,
        acceptableIncome: {
          basis: acceptableIncomeBasis,
          minAnnualNet: acceptableIncomeMinAnnualNet,
          maxAnnualNet: acceptableIncomeMaxAnnualNet
        },
        desiredIncomeDisplayMode,
        taxRate: inputs.taxRate,
        activeMonths: inputs.activeMonths,
        hoursPerLesson: inputs.hoursPerLesson
      });
      const targetsTable = mode === PRICING_MODE_LESSON
        ? ''
        : buildActiveTargetsTable({
            currencySymbol: inputs.currencySymbol,
            revenueNeeded,
            workingDaysPerYear: inputs.workingDaysPerYear,
            workingWeeks: inputs.workingWeeks,
            activeMonths: inputs.activeMonths
          });
  
      tablesContainer.innerHTML = pricingTable + targetsTable;
      scheduleTablesLayoutUpdate();
    }
  
    if (breakdownDialog && !breakdownDialog.hidden) {
      if (!latestPricingData || !refreshBreakdownDialog()) {
        closeBreakdownDialog();
      }
    } else if (!latestPricingData) {
      activeBreakdownContext = null;
      breakdownTriggerElement = null;
    }
  
    enhanceAllInfoIcons();
    renderAssumptions(inputs, { mode });
  }
  
  function renderAssumptions(inputs, { mode } = {}) {
    const {
      targetNet,
      targetNetPerWeek,
      targetNetPerMonth,
      targetNetAveragePerWeek,
      targetNetAveragePerMonth,
      taxRate,
      fixedCosts,
      variableCostPerClass,
      variableCostPerStudent,
      variableCostPerStudentMonthly,
      vatRate,
      classesPerWeek,
      studentsPerClass,
      hoursPerLesson,
      workingWeeks,
      bufferPercent,
      currencySymbol,
      monthsOff,
      weeksOffPerCycle,
      daysOffPerWeek,
      workingDaysPerWeek,
      workingDaysPerYear,
      activeMonths,
      activeMonthShare,
      weeksShare,
      lessonCostInclVat,
      lessonPriceMin,
      lessonPriceMax
    } = inputs;
  
    const activeMonthPercentage = activeMonthShare * 100;
    const activeWeeksPercentage = weeksShare * 100;
    const workingWeeksPerCycle = 4 * weeksShare;
  
    const targetPerWeekDisplay = Number.isFinite(targetNetPerWeek)
      ? formatCurrency(currencySymbol, targetNetPerWeek)
      : '–';
    const targetPerMonthDisplay = Number.isFinite(targetNetPerMonth)
      ? formatCurrency(currencySymbol, targetNetPerMonth)
      : '–';
    const targetAveragePerWeekDisplay = Number.isFinite(targetNetAveragePerWeek)
      ? formatCurrency(currencySymbol, targetNetAveragePerWeek)
      : '–';
    const targetAveragePerMonthDisplay = Number.isFinite(targetNetAveragePerMonth)
      ? formatCurrency(currencySymbol, targetNetAveragePerMonth)
      : '–';
  
    const manualLessonLine = Number.isFinite(lessonCostInclVat)
      ? `Preferred lesson price (incl. VAT): ${currencySymbol}${formatFixed(lessonCostInclVat, 2)}`
      : 'Preferred lesson price (incl. VAT): not set';
    const lessonMinLine = Number.isFinite(lessonPriceMin)
      ? `Minimum preferred lesson price (incl. VAT): ${currencySymbol}${formatFixed(lessonPriceMin, 2)}`
      : 'Minimum preferred lesson price (incl. VAT): not set';
    const lessonMaxLine = Number.isFinite(lessonPriceMax)
      ? `Maximum preferred lesson price (incl. VAT): ${currencySymbol}${formatFixed(lessonPriceMax, 2)}`
      : 'Maximum preferred lesson price (incl. VAT): not set';
  
    const listItems = [
      `Net income per year: ${formatCurrency(currencySymbol, targetNet)}`,
      `Net income per active week: ${targetPerWeekDisplay}`,
      `Net income per active month: ${targetPerMonthDisplay}`,
      `Average weekly net income: ${targetAveragePerWeekDisplay}`,
      `Average monthly net income: ${targetAveragePerMonthDisplay}`,
      manualLessonLine,
      lessonMinLine,
      lessonMaxLine,
      `Effective income tax rate: ${formatFixed(taxRate * 100, 1)}%`,
      `Fixed annual costs: ${formatCurrency(currencySymbol, fixedCosts)}`,
      `Variable cost per class: ${formatCurrency(currencySymbol, variableCostPerClass)} (per scheduled class)`,
      `Variable cost per student: ${formatCurrency(currencySymbol, variableCostPerStudent)} (per student per class)`,
      `Variable monthly cost per student: ${formatCurrency(currencySymbol, variableCostPerStudentMonthly)} (multiplied by class size each active month)`,
      `Months off per year: ${formatFixed(monthsOff, 2)} (≈ ${formatFixed(activeMonths, 2)} active months; ${formatFixed(activeMonthPercentage, 1)}% of the year)`,
      `Weeks off per 4-week cycle: ${formatFixed(weeksOffPerCycle, 2)} (≈ ${formatFixed(workingWeeksPerCycle, 2)} working weeks each cycle; ${formatFixed(activeWeeksPercentage, 1)}% active weeks)`,
      `Days off per 7-day week: ${formatFixed(daysOffPerWeek, 2)} (≈ ${formatFixed(workingDaysPerWeek, 2)} working days when active)`,
      `Estimated working weeks per year: ${formatFixed(workingWeeks, 2)}`,
      `Estimated working days per year: ${formatFixed(workingDaysPerYear, 2)}`,
      `Classes per week considered: ${classesPerWeek.length ? classesPerWeek.join(', ') : 'none'}`,
      `Students per class considered: ${studentsPerClass.length ? studentsPerClass.join(', ') : 'none'}`,
      `Hours per lesson: ${formatFixed(hoursPerLesson, 2)}`,
      `Extra safety margin (% on top of desired income): ${formatFixed(bufferPercent, 1)}%`,
      `VAT/BTW rate: ${formatFixed(vatRate * 100, 1)}%`,
      `Currency symbol: ${currencySymbol}`,
      `Prices are rounded to whole currency units for display and CSV export.`
    ];
  
    assumptionsList.innerHTML = listItems.map(item => `<li>${item}</li>`).join('');
  }
  
  function downloadCsv() {
    if (!latestResults.length) {
      controls.statusMessage.textContent = 'Add at least one class and student value before exporting CSV.';
      setTimeout(() => {
        controls.statusMessage.textContent = '';
      }, 2500);
      return;
    }
  
    let header;
    let rows;
  
    if (latestResultsMode === PRICING_MODE_LESSON) {
      header = 'Variant,Students,Classes per week,Classes per year,Monthly net income,Annual net income';
      rows = latestResults.map(entry => {
        const monthly = Number.isFinite(entry.monthlyNet) ? Math.round(entry.monthlyNet) : '';
        const annual = Number.isFinite(entry.annualNet) ? Math.round(entry.annualNet) : '';
        return [
          entry.variant,
          entry.students,
          entry.classesPerWeek,
          entry.classesPerYear,
          monthly,
          annual
        ].join(',');
      });
    } else {
      header = 'Variant,Students,Classes per week,Classes per year,Price incl VAT,Price ex VAT';
      rows = latestResults.map(entry => [
        entry.variant,
        entry.students,
        entry.classesPerWeek,
        entry.classesPerYear,
        entry.priceInclVat,
        entry.priceExVat
      ].join(','));
    }
  
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `course-pricing-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    controls.statusMessage.textContent = latestResultsMode === PRICING_MODE_LESSON
      ? 'CSV download started. File lists monthly and annual net income for each combination.'
      : 'CSV download started. File lists base and buffered prices including and excluding VAT.';
    setTimeout(() => {
      controls.statusMessage.textContent = '';
    }, 2500);
  }
  
  [
    { control: controls.targetNet, basis: 'year' },
    { control: controls.targetNetWeek, basis: 'week' },
    { control: controls.targetNetMonth, basis: 'month' },
    { control: controls.targetNetAverageWeek, basis: 'avgWeek' },
    { control: controls.targetNetAverageMonth, basis: 'avgMonth' }
  ].forEach(({ control, basis }) => {
    if (!(control instanceof HTMLInputElement)) return;
    const handleInput = () => {
      targetNetBasis = basis;
      updateDesiredIncomeFromField(basis);
      desiredIncomePreviousNetValues = null;
    };
    control.addEventListener('focus', () => {
      control.dataset.editing = 'true';
    });
    control.addEventListener('blur', () => {
      delete control.dataset.editing;
    });
    control.addEventListener('input', handleInput);
    control.addEventListener('change', () => {
      handleInput();
      const netValue = readDesiredIncomeNet(basis, null);
      if (Number.isFinite(netValue)) {
        const displayValue = desiredIncomeDisplayMode === 'gross'
          ? convertNetToGross(netValue, getCurrentTaxRate())
          : netValue;
        control.value = formatFixed(displayValue, 2);
      }
    });
  });
  
  if (controls.acceptableIncomeMin instanceof HTMLInputElement) {
    const updateMin = () => {
      updateAcceptableIncomeFromInput('min');
    };
    controls.acceptableIncomeMin.addEventListener('focus', () => {
      controls.acceptableIncomeMin.dataset.editing = 'true';
    });
    controls.acceptableIncomeMin.addEventListener('blur', () => {
      delete controls.acceptableIncomeMin.dataset.editing;
    });
    controls.acceptableIncomeMin.addEventListener('input', updateMin);
    controls.acceptableIncomeMin.addEventListener('change', () => {
      updateMin();
      refreshAcceptableIncomeDisplay(getCurrentTaxRate(), { force: true });
    });
  }
  
  if (controls.acceptableIncomeMax instanceof HTMLInputElement) {
    const updateMax = () => {
      updateAcceptableIncomeFromInput('max');
    };
    controls.acceptableIncomeMax.addEventListener('focus', () => {
      controls.acceptableIncomeMax.dataset.editing = 'true';
    });
    controls.acceptableIncomeMax.addEventListener('blur', () => {
      delete controls.acceptableIncomeMax.dataset.editing;
    });
    controls.acceptableIncomeMax.addEventListener('input', updateMax);
    controls.acceptableIncomeMax.addEventListener('change', () => {
      updateMax();
      refreshAcceptableIncomeDisplay(getCurrentTaxRate(), { force: true });
    });
  }
  
  const acceptableBasisControls = [
    { control: controls.acceptableIncomeBasisMonthly, value: 'monthly' },
    { control: controls.acceptableIncomeBasisAnnual, value: 'annual' }
  ];
  
  acceptableBasisControls.forEach(({ control, value }) => {
    if (!(control instanceof HTMLInputElement)) {
      return;
    }
    control.addEventListener('change', () => {
      if (!control.checked) {
        return;
      }
      acceptableIncomeBasis = value;
      clearAcceptableIncomeEditingState();
      refreshAcceptableIncomeDisplay(getCurrentTaxRate(), { force: true });
    });
  });
  
  if (controls.desiredIncomeToggleDisplay instanceof HTMLButtonElement) {
    controls.desiredIncomeToggleDisplay.addEventListener('click', () => {
      desiredIncomeDisplayMode = desiredIncomeDisplayMode === 'gross' ? 'net' : 'gross';
      if (!desiredIncomeLockedAsGross) {
        desiredIncomePreviousNetValues = null;
      }
      clearDesiredIncomeEditingState();
      clearAcceptableIncomeEditingState();
      updateDesiredIncomeTitle();
      updateDesiredIncomeLabels();
      updateAcceptableIncomeBasisLabel();
      updateDesiredIncomeTooltips();
      render();
    });
  }
  
  if (controls.desiredIncomeToggleInterpretation instanceof HTMLButtonElement) {
    controls.desiredIncomeToggleInterpretation.addEventListener('click', () => {
      const taxRate = getCurrentTaxRate();
      if (!desiredIncomeLockedAsGross) {
        desiredIncomePreviousNetValues = captureDesiredIncomeNetValues();
        previousAcceptableIncome = {
          min: acceptableIncomeMinAnnualNet,
          max: acceptableIncomeMaxAnnualNet
        };
        desiredIncomeDisplayMode = 'gross';
        clearDesiredIncomeLockedGrossStore();
        clearLockedAcceptableIncomeGross();
        desiredIncomeLockedAsGross = true;
        Object.keys(desiredIncomeFieldMap).forEach(key => {
          updateDesiredIncomeFromField(key);
        });
        updateAcceptableIncomeFromInput('min');
        updateAcceptableIncomeFromInput('max');
        clearDesiredIncomeEditingState();
        clearAcceptableIncomeEditingState();
        updateDesiredIncomeTitle();
        updateDesiredIncomeLabels();
        updateAcceptableIncomeBasisLabel();
        updateDesiredIncomeTooltips();
        refreshAcceptableIncomeDisplay(taxRate, { force: true });
        render();
      } else {
        desiredIncomeLockedAsGross = false;
        clearDesiredIncomeLockedGrossStore();
        clearLockedAcceptableIncomeGross();
        desiredIncomeDisplayMode = 'net';
        if (desiredIncomePreviousNetValues) {
          restoreDesiredIncomeNetValues(desiredIncomePreviousNetValues);
        }
        if (previousAcceptableIncome) {
          acceptableIncomeMinAnnualNet = Number.isFinite(previousAcceptableIncome.min)
            ? previousAcceptableIncome.min
            : null;
          acceptableIncomeMaxAnnualNet = Number.isFinite(previousAcceptableIncome.max)
            ? previousAcceptableIncome.max
            : null;
        }
        desiredIncomePreviousNetValues = null;
        previousAcceptableIncome = null;
        clearDesiredIncomeEditingState();
        clearAcceptableIncomeEditingState();
        updateDesiredIncomeTitle();
        updateDesiredIncomeLabels();
        updateAcceptableIncomeBasisLabel();
        updateDesiredIncomeTooltips();
        refreshAcceptableIncomeDisplay(taxRate, { force: true });
        render();
      }
    });
  }
  
  Object.values(controls).forEach(control => {
    if (!(control instanceof HTMLInputElement)) return;
    if (control === controls.lessonCost) return;
    control.addEventListener('change', render);
    control.addEventListener('input', event => {
      if (event.target.type === 'text') return;
      render();
    });
  });
  
  if (controls.lessonCost instanceof HTMLInputElement) {
    const handleLessonCostInput = () => {
      render();
    };
  
    controls.lessonCost.addEventListener('input', handleLessonCostInput);
    controls.lessonCost.addEventListener('change', handleLessonCostInput);
  }
  
  window.addEventListener('resize', scheduleTablesLayoutUpdate);
  
  tablesContainer.addEventListener('click', event => {
    const priceButton = event.target instanceof HTMLElement
      ? event.target.closest('button.price-line[data-row][data-column][data-variant]')
      : null;
  
    if (priceButton) {
      const context = {
        rowIndex: Number(priceButton.dataset.row),
        columnIndex: Number(priceButton.dataset.column),
        variant: priceButton.dataset.variant === 'base' ? 'base' : 'buffered'
      };
      openBreakdownDialog(context, priceButton);
      return;
    }
  
    const toggleButton = event.target instanceof HTMLElement ? event.target.closest('.price-reveal-toggle') : null;
    if (!toggleButton) {
      return;
    }
    event.preventDefault();
    showBasePrices = !showBasePrices;
    render();
    const refreshedToggle = tablesContainer.querySelector('.price-reveal-toggle');
    if (refreshedToggle instanceof HTMLButtonElement) {
      refreshedToggle.focus();
    }
  });
  
  controls.recalcButton.addEventListener('click', render);
  controls.downloadCsv.addEventListener('click', downloadCsv);
  
  initializePersistence();
  render();
}
