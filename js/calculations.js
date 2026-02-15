import { escapeHtml, formatCurrency, formatFixed } from "./utils.js";

const MONTHS_PER_YEAR = 12;

export function computeNetIncomeFromRevenue(revenue, fixedCosts, effectiveTaxRate, variableCosts = 0) {
  if (!Number.isFinite(revenue)) {
    return null;
  }
  const normalizedVariableCosts = Number.isFinite(variableCosts) ? variableCosts : 0;
  const profitBeforeTax = revenue - fixedCosts - normalizedVariableCosts;
  return profitBeforeTax * (1 - effectiveTaxRate);
}

export function computeAnnualVariableCosts({
  variableCostPerClass,
  variableCostPerStudent,
  variableCostPerStudentMonthly,
  students,
  classesPerYear,
  activeMonths,
}) {
  return (
    variableCostPerClass * classesPerYear +
    variableCostPerStudent * students * classesPerYear +
    variableCostPerStudentMonthly * students * activeMonths
  );
}

export function buildPriceBreakdown({
  priceExVatValue,
  priceInclVatValue,
  studentCount,
  classesPerYearValue,
  fixedCosts,
  variableCostPerClass,
  variableCostPerStudent,
  variableCostPerStudentMonthly,
  normalizedActiveMonths,
  effectiveTaxRate,
}) {
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
  const variableCostsPerLesson = variableCostPerClass + variableCostPerStudent * actualStudents + monthlyCostPerLesson;
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
      netIncome: netIncomePerLesson,
    },
    perStudent: {
      vat: vatPerStudent,
      variableCosts: variableCostsPerLesson / safeStudents,
      fixedCostAllocation: fixedAllocationPerLesson / safeStudents,
      incomeTax: incomeTaxPerLesson / safeStudents,
      netIncome: netIncomePerLesson / safeStudents,
    },
    totals: {
      priceInclVatPerStudent: normalizedPriceInclVat,
      priceExVatPerStudent: normalizedPriceExVat,
      priceInclVatPerLesson: normalizedPriceInclVat * actualStudents,
      priceExVatPerLesson: revenueExVatPerLesson,
      students: actualStudents,
      classesPerYear: actualClassesPerYear,
    },
  };
}

export function shouldHighlightIncome({ monthlyNet, annualNet }, options = {}) {
  const { acceptableIncome = null, displayMode = "net", taxRate = 0, activeMonths = MONTHS_PER_YEAR } = options;

  if (!acceptableIncome || typeof acceptableIncome !== "object") {
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
  const averageMonthsForRange = MONTHS_PER_YEAR;

  const convertNetToDisplay = (value) => {
    if (!Number.isFinite(value)) {
      return null;
    }
    return displayMode === "gross" ? value / denominator : value;
  };

  if (basis === "annual") {
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

  if (basis === "averageMonthly") {
    if (!Number.isFinite(annualNet)) {
      return false;
    }
    const valueDisplay = convertNetToDisplay(annualNet / averageMonthsForRange);
    const minDisplay = hasMin ? convertNetToDisplay(minAnnualNet / averageMonthsForRange) : null;
    const maxDisplay = hasMax ? convertNetToDisplay(maxAnnualNet / averageMonthsForRange) : null;
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

export function buildCostsSummary(costs, symbol, activeMonths) {
  const fixedCostLabels = {
    location: "Location / venue",
    insurance: "Business insurance",
    disability: "Disability insurance (AOV)",
    health: "Health insurance premium",
    pension: "Pension contributions",
    marketing: "Marketing",
    materials: "Materials",
    admin: "Admin / software",
    development: "Professional development",
  };
  const variableCostLabels = {
    perClass: "Variable cost per class",
    perStudent: "Variable cost per student",
    perStudentMonthly: "Variable monthly cost per student",
  };

  const includedCosts = [];
  const excludedCosts = [];

  Object.entries(fixedCostLabels).forEach(([key, label]) => {
    const annualValue = costs.fixed?.[key] ?? 0;
    if (annualValue > 0) {
      const monthlyValue = activeMonths > 0 ? annualValue / activeMonths : annualValue / MONTHS_PER_YEAR;
      includedCosts.push(`${label} (${formatCurrency(symbol, monthlyValue)})`);
    } else {
      excludedCosts.push(label);
    }
  });

  const variableCostKeys = [
    { key: "perClass", value: costs.variable?.perClass ?? 0 },
    { key: "perStudent", value: costs.variable?.perStudent ?? 0 },
    { key: "perStudentMonthly", value: costs.variable?.perStudentMonthly ?? 0 },
  ];
  variableCostKeys.forEach(({ key, value }) => {
    const label = variableCostLabels[key];
    if (value > 0) {
      includedCosts.push(`${label} (${formatCurrency(symbol, value)})`);
    } else {
      excludedCosts.push(label);
    }
  });

  const includedHtml = includedCosts.length
    ? `<p class="costs-summary-item"><strong>Costs included (monthly):</strong> ${escapeHtml(includedCosts.join(", "))}</p>`
    : `<p class="costs-summary-item"><strong>Costs included (monthly):</strong> <em>None</em></p>`;
  const excludedHtml = excludedCosts.length
    ? `<p class="costs-summary-item"><strong>Costs not included:</strong> ${escapeHtml(excludedCosts.join(", "))}</p>`
    : "";

  return `<div class="costs-summary">${includedHtml}${excludedHtml}</div>`;
}

export function getInputs(controls, context) {
  const {
    desiredIncomeFieldMap,
    targetNetBasis,
    isInputEditing,
    applyFieldValidationState,
    fieldValidationOptions,
    validateNumberInput,
    TARGET_NET_DEFAULT,
    DEFAULT_MONTHS_OFF,
    MONTHS_PER_YEAR,
    DEFAULT_WEEKS_OFF_YEAR,
    WEEKS_PER_YEAR,
    BASE_WORK_DAYS_PER_WEEK,
    timeOffSyncSource,
    desiredIncomeLockedAsGross,
    synchronizeLockedDesiredIncomeNetValues,
    fixedCostFields,
    updateFixedCostTotalDisplay,
    parseList,
    parseManualLessonPrices,
    ERROR_MESSAGE_RANGE_ORDER,
    synchronizeLockedAcceptableIncomeNetValues,
    setLastActiveMonths,
    setLastWorkingWeeks,
    readDesiredIncomeNet,
    getDesiredIncomeField,
    writeDesiredIncomeNet,
    refreshDesiredIncomeDisplay,
    refreshAcceptableIncomeDisplay,
    updateInputValueIfAllowedWithValidationClass,
    formatFixed,
  } = context;

  // function body migrated from app.js
  Object.entries(desiredIncomeFieldMap).forEach(([key, field]) => {
    const isActiveBasis = targetNetBasis === key;
    if (isActiveBasis && isInputEditing(field)) {
      // Keep active desired-income fields editable while typing; validate on commit.
      applyFieldValidationState(field, null, fieldValidationOptions);
      return;
    }
    const required = isActiveBasis;
    const state = validateNumberInput(field, { fallback: TARGET_NET_DEFAULT, min: 0, required });
    applyFieldValidationState(field, state.message, fieldValidationOptions);
  });

  const monthsOffState = validateNumberInput(controls.monthsOff, {
    fallback: DEFAULT_MONTHS_OFF,
    min: 0,
    max: MONTHS_PER_YEAR,
    required: true,
  });
  const weeksOffYearState = validateNumberInput(controls.weeksOffYear, {
    fallback: DEFAULT_WEEKS_OFF_YEAR,
    min: 0,
    max: WEEKS_PER_YEAR,
    required: true,
  });
  const weeksOffCycleState = validateNumberInput(controls.weeksOffCycle, {
    fallback: 1,
    min: 0,
    max: 4,
    required: true,
  });
  const daysOffWeekState = validateNumberInput(controls.daysOffWeek, {
    fallback: 2,
    min: 0,
    max: BASE_WORK_DAYS_PER_WEEK,
    required: true,
  });

  applyFieldValidationState(controls.monthsOff, monthsOffState.message, fieldValidationOptions);
  applyFieldValidationState(controls.weeksOffYear, weeksOffYearState.message, fieldValidationOptions);
  applyFieldValidationState(controls.weeksOffCycle, weeksOffCycleState.message, fieldValidationOptions);
  applyFieldValidationState(controls.daysOffWeek, daysOffWeekState.message, fieldValidationOptions);

  let monthsOff = monthsOffState.value;
  let weeksOffYear = weeksOffYearState.value;
  if (timeOffSyncSource === "weeks" && weeksOffYearState.valid) {
    monthsOff = (weeksOffYearState.value / WEEKS_PER_YEAR) * MONTHS_PER_YEAR;
  } else if (timeOffSyncSource === "months" && monthsOffState.valid) {
    weeksOffYear = (monthsOffState.value / MONTHS_PER_YEAR) * WEEKS_PER_YEAR;
  } else if (monthsOffState.valid) {
    weeksOffYear = (monthsOffState.value / MONTHS_PER_YEAR) * WEEKS_PER_YEAR;
  } else if (weeksOffYearState.valid) {
    monthsOff = (weeksOffYearState.value / WEEKS_PER_YEAR) * MONTHS_PER_YEAR;
  }

  const weeksOffPerCycle = weeksOffCycleState.value;
  const daysOffPerWeek = daysOffWeekState.value;

  const taxRateState = validateNumberInput(controls.taxRate, {
    fallback: 40,
    min: 0,
    max: 99.9,
    required: true,
  });
  applyFieldValidationState(controls.taxRate, taxRateState.message, fieldValidationOptions);

  const taxRatePercent = taxRateState.value;
  const taxRate = taxRatePercent / 100;
  if (desiredIncomeLockedAsGross) {
    synchronizeLockedDesiredIncomeNetValues(taxRate);
  }

  Object.values(fixedCostFields).forEach((fieldSet) => {
    if (fieldSet.monthly instanceof HTMLInputElement) {
      const state = validateNumberInput(fieldSet.monthly, { fallback: 0, min: 0, required: false });
      applyFieldValidationState(fieldSet.monthly, state.message, fieldValidationOptions);
    }
    if (fieldSet.annual instanceof HTMLInputElement) {
      const state = validateNumberInput(fieldSet.annual, { fallback: 0, min: 0, required: false });
      applyFieldValidationState(fieldSet.annual, state.message, fieldValidationOptions);
    }
  });

  const fixedCosts = updateFixedCostTotalDisplay();
  const variableCostPerClassState = validateNumberInput(controls.variableCostPerClass, {
    fallback: 0,
    min: 0,
    required: false,
  });
  const variableCostPerStudentState = validateNumberInput(controls.variableCostPerStudent, {
    fallback: 0,
    min: 0,
    required: false,
  });
  const variableCostPerStudentMonthlyState = validateNumberInput(controls.variableCostPerStudentMonthly, {
    fallback: 0,
    min: 0,
    required: false,
  });
  const vatRateState = validateNumberInput(controls.vatRate, {
    fallback: 21,
    min: 0,
    max: 99.9,
    required: true,
  });
  applyFieldValidationState(controls.variableCostPerClass, variableCostPerClassState.message, fieldValidationOptions);
  applyFieldValidationState(controls.variableCostPerStudent, variableCostPerStudentState.message, fieldValidationOptions);
  applyFieldValidationState(controls.variableCostPerStudentMonthly, variableCostPerStudentMonthlyState.message, fieldValidationOptions);
  applyFieldValidationState(controls.vatRate, vatRateState.message, fieldValidationOptions);

  const variableCostPerClass = Math.max(variableCostPerClassState.value, 0);
  const variableCostPerStudent = Math.max(variableCostPerStudentState.value, 0);
  const variableCostPerStudentMonthly = Math.max(variableCostPerStudentMonthlyState.value, 0);
  const vatRate = Math.max(vatRateState.value, 0) / 100;
  const classesPerWeek = parseList(controls.classesPerWeek.value);
  const studentsPerClass = parseList(controls.studentsPerClass.value);
  const hoursPerLessonState = validateNumberInput(controls.hoursPerLesson, {
    fallback: 1,
    min: 0.25,
    max: 12,
    required: true,
  });
  const bufferState = validateNumberInput(controls.buffer, {
    fallback: 15,
    min: 0,
    max: 99.9,
    required: true,
  });
  applyFieldValidationState(controls.hoursPerLesson, hoursPerLessonState.message, fieldValidationOptions);
  applyFieldValidationState(controls.buffer, bufferState.message, fieldValidationOptions);

  const hoursPerLesson = Math.max(hoursPerLessonState.value, 0.25);
  const bufferPercent = Math.max(bufferState.value, 0);
  const buffer = bufferPercent / 100;
  const currencySymbol = controls.currencySymbol.value.trim() || "€";
  const lessonCostListState = parseManualLessonPrices(controls.lessonCost?.value);
  const lessonPriceMinState = validateNumberInput(controls.lessonPriceMin, {
    fallback: null,
    min: 0,
    required: false,
  });
  const lessonPriceMaxState = validateNumberInput(controls.lessonPriceMax, {
    fallback: null,
    min: 0,
    required: false,
  });
  applyFieldValidationState(controls.lessonCost, lessonCostListState.message, fieldValidationOptions);
  applyFieldValidationState(controls.lessonPriceMin, lessonPriceMinState.message, fieldValidationOptions);
  applyFieldValidationState(controls.lessonPriceMax, lessonPriceMaxState.message, fieldValidationOptions);

  const lessonCostInclVatOptions = lessonCostListState.valid ? lessonCostListState.values : [];
  const lessonCostInclVat = lessonCostInclVatOptions.length ? lessonCostInclVatOptions[0] : null;
  let lessonPriceMin = lessonPriceMinState.valid && !lessonPriceMinState.empty ? lessonPriceMinState.value : null;
  let lessonPriceMax = lessonPriceMaxState.valid && !lessonPriceMaxState.empty ? lessonPriceMaxState.value : null;

  if (lessonPriceMin != null && lessonPriceMax != null && lessonPriceMin > lessonPriceMax) {
    const lessonPriceMinMessage = [lessonPriceMinState.message, ERROR_MESSAGE_RANGE_ORDER].filter(Boolean).join(" ");
    const lessonPriceMaxMessage = [lessonPriceMaxState.message, ERROR_MESSAGE_RANGE_ORDER].filter(Boolean).join(" ");
    applyFieldValidationState(controls.lessonPriceMin, lessonPriceMinMessage, fieldValidationOptions);
    applyFieldValidationState(controls.lessonPriceMax, lessonPriceMaxMessage, fieldValidationOptions);
    lessonPriceMin = null;
    lessonPriceMax = null;
  }

  if (controls.acceptableIncomeMin instanceof HTMLInputElement) {
    const state = validateNumberInput(controls.acceptableIncomeMin, {
      fallback: 0,
      min: 0,
      required: false,
    });
    applyFieldValidationState(controls.acceptableIncomeMin, state.message, fieldValidationOptions);
  }
  if (controls.acceptableIncomeMax instanceof HTMLInputElement) {
    const state = validateNumberInput(controls.acceptableIncomeMax, {
      fallback: 0,
      min: 0,
      required: false,
    });
    applyFieldValidationState(controls.acceptableIncomeMax, state.message, fieldValidationOptions);
  }

  const activeMonthShare = Math.min(Math.max((12 - monthsOff) / 12, 0), 1);
  const activeMonths = 12 * activeMonthShare;
  const weeksShare = Math.min(Math.max((4 - weeksOffPerCycle) / 4, 0), 1);
  const workingWeeks = WEEKS_PER_YEAR * activeMonthShare * weeksShare;
  const workingDaysPerWeek = Math.max(0, Math.min(BASE_WORK_DAYS_PER_WEEK, BASE_WORK_DAYS_PER_WEEK - daysOffPerWeek));
  const workingDaysPerYear = workingWeeks * workingDaysPerWeek;

  setLastActiveMonths(activeMonths);
  setLastWorkingWeeks(workingWeeks);
  if (desiredIncomeLockedAsGross) {
    synchronizeLockedAcceptableIncomeNetValues(taxRate, activeMonths);
  }

  const defaultTargetNetWeek = workingWeeks > 0 ? TARGET_NET_DEFAULT / workingWeeks : TARGET_NET_DEFAULT;
  const defaultTargetNetMonth = activeMonths > 0 ? TARGET_NET_DEFAULT / activeMonths : TARGET_NET_DEFAULT;
  const defaultTargetNetAverageWeek = TARGET_NET_DEFAULT / WEEKS_PER_YEAR;
  const defaultTargetNetAverageMonth = TARGET_NET_DEFAULT / MONTHS_PER_YEAR;

  const storedYearNet = readDesiredIncomeNet("year", null);
  const storedWeekNet = readDesiredIncomeNet("week", null);
  const storedMonthNet = readDesiredIncomeNet("month", null);
  const storedAvgWeekNet = readDesiredIncomeNet("avgWeek", null);
  const storedAvgMonthNet = readDesiredIncomeNet("avgMonth", null);

  const netYearValue = Number.isFinite(storedYearNet) ? Math.max(storedYearNet, 0) : TARGET_NET_DEFAULT;
  const netWeekValue = Number.isFinite(storedWeekNet) ? Math.max(storedWeekNet, 0) : defaultTargetNetWeek;
  const netMonthValue = Number.isFinite(storedMonthNet) ? Math.max(storedMonthNet, 0) : defaultTargetNetMonth;
  const netAvgWeekValue = Number.isFinite(storedAvgWeekNet) ? Math.max(storedAvgWeekNet, 0) : defaultTargetNetAverageWeek;
  const netAvgMonthValue = Number.isFinite(storedAvgMonthNet) ? Math.max(storedAvgMonthNet, 0) : defaultTargetNetAverageMonth;

  const hasWorkingWeeks = workingWeeks > 0;
  const hasActiveMonths = activeMonths > 0;

  let targetNet;
  if (targetNetBasis === "week") {
    targetNet = hasWorkingWeeks ? netWeekValue * workingWeeks : netYearValue;
  } else if (targetNetBasis === "month") {
    targetNet = hasActiveMonths ? netMonthValue * activeMonths : netYearValue;
  } else if (targetNetBasis === "avgWeek") {
    targetNet = netAvgWeekValue * WEEKS_PER_YEAR;
  } else if (targetNetBasis === "avgMonth") {
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
    avgMonth: targetNetAveragePerMonth,
  };

  Object.entries(derivedNetValues).forEach(([key, value]) => {
    if (key === targetNetBasis) {
      const activeField = getDesiredIncomeField(key);
      const activeRaw = activeField && typeof activeField.value === "string" ? activeField.value.trim() : "";
      const shouldBackfillActive = !isInputEditing(activeField) && activeRaw !== "";
      if (!Number.isFinite(readDesiredIncomeNet(key, null)) && Number.isFinite(value) && shouldBackfillActive) {
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

  updateInputValueIfAllowedWithValidationClass(controls.taxRate, taxRateState, formatFixed(taxRate * 100, 1));
  if (controls.fixedCosts instanceof HTMLInputElement) {
    controls.fixedCosts.value = formatFixed(fixedCosts, 2);
  }
  updateInputValueIfAllowedWithValidationClass(controls.variableCostPerClass, variableCostPerClassState, formatFixed(variableCostPerClass, 2));
  updateInputValueIfAllowedWithValidationClass(controls.variableCostPerStudent, variableCostPerStudentState, formatFixed(variableCostPerStudent, 2));
  updateInputValueIfAllowedWithValidationClass(
    controls.variableCostPerStudentMonthly,
    variableCostPerStudentMonthlyState,
    formatFixed(variableCostPerStudentMonthly, 2),
  );
  updateInputValueIfAllowedWithValidationClass(controls.vatRate, vatRateState, formatFixed(vatRate * 100, 1));
  updateInputValueIfAllowedWithValidationClass(controls.hoursPerLesson, hoursPerLessonState, formatFixed(hoursPerLesson, 2));
  updateInputValueIfAllowedWithValidationClass(
    controls.lessonPriceMin,
    lessonPriceMinState,
    lessonPriceMin == null || !Number.isFinite(lessonPriceMin) ? "" : formatFixed(lessonPriceMin, 2),
    { allowEmpty: true },
  );
  updateInputValueIfAllowedWithValidationClass(
    controls.lessonPriceMax,
    lessonPriceMaxState,
    lessonPriceMax == null || !Number.isFinite(lessonPriceMax) ? "" : formatFixed(lessonPriceMax, 2),
    { allowEmpty: true },
  );
  updateInputValueIfAllowedWithValidationClass(controls.monthsOff, monthsOffState, formatFixed(monthsOff, 2));
  updateInputValueIfAllowedWithValidationClass(controls.weeksOffYear, weeksOffYearState, formatFixed(weeksOffYear, 2));
  updateInputValueIfAllowedWithValidationClass(controls.weeksOffCycle, weeksOffCycleState, formatFixed(weeksOffPerCycle, 2));
  updateInputValueIfAllowedWithValidationClass(controls.daysOffWeek, daysOffWeekState, formatFixed(daysOffPerWeek, 2));
  updateInputValueIfAllowedWithValidationClass(controls.buffer, bufferState, formatFixed(buffer * 100, 1));
  if (controls.currencySymbol instanceof HTMLInputElement && controls.currencySymbol.dataset.editing !== "true") {
    controls.currencySymbol.value = currencySymbol;
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
    lessonCostInclVatOptions,
    lessonPriceMin,
    lessonPriceMax,
    workingWeeks,
    buffer,
    bufferPercent,
    currencySymbol,
    monthsOff,
    weeksOffYear,
    weeksOffPerCycle,
    daysOffPerWeek,
    workingDaysPerWeek,
    workingDaysPerYear,
    activeMonths,
    activeMonthShare,
    weeksShare,
  };
}
