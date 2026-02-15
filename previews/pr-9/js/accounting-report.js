import {
  escapeHtml,
  formatCurrencyDetailed,
  formatCurrencyOrDash,
  formatFixed,
  formatNumberValue,
} from "./utils.js";

const MONTHS_PER_YEAR = 12;
const PRICING_MODE_TARGET = "target";

export function buildAccountingReport({
  studentsRequested,
  classesPerWeekRequested,
  hoursPerClassRequested,
  combination,
  inputs,
  currencySymbol,
  pricingMode,
  bufferPercent,
  bufferedMonthlyNet,
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
  const classesPerWeekUsed = Number.isFinite(column.classesPerWeek) ? column.classesPerWeek : classesPerWeekRequested;
  const workingWeeks = Number.isFinite(inputs?.workingWeeks) ? inputs.workingWeeks : 0;
  const activeMonths = Number.isFinite(inputs?.activeMonths) && inputs.activeMonths > 0 ? inputs.activeMonths : MONTHS_PER_YEAR;
  const classesPerYear = Number.isFinite(column.classesPerYear) ? column.classesPerYear : classesPerWeekUsed * workingWeeks;
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

  const variableCostPerClass = Number.isFinite(inputs?.variableCostPerClass) ? inputs.variableCostPerClass : 0;
  const variableCostPerStudent = Number.isFinite(inputs?.variableCostPerStudent) ? inputs.variableCostPerStudent : 0;
  const variableCostPerStudentMonthly = Number.isFinite(inputs?.variableCostPerStudentMonthly) ? inputs.variableCostPerStudentMonthly : 0;
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
  const effectiveHourlyNet = Number.isFinite(monthlyHours) && monthlyHours > 0 ? monthlyNetIncome / monthlyHours : null;
  const effectiveHourlyGross = Number.isFinite(monthlyHours) && monthlyHours > 0 ? monthlyRevenueInclVat / monthlyHours : null;
  const approxWeeksPerActiveMonth = activeMonths > 0 && Number.isFinite(workingWeeks) ? workingWeeks / activeMonths : 0;

  const currency = typeof currencySymbol === "string" && currencySymbol.trim() !== "" ? currencySymbol : "€";
  const now = new Date();
  const generatedDisplay = now.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });

  const notes = [];
  if (!exactStudents && Number.isFinite(studentsRequested)) {
    notes.push(
      `Requested ${formatNumberValue(studentsRequested, 2)} students; closest available combination uses ${formatNumberValue(studentsUsed, 2)}.`,
    );
  }
  if (!exactClasses && Number.isFinite(classesPerWeekRequested)) {
    notes.push(
      `Requested ${formatNumberValue(classesPerWeekRequested, 2)} classes per week; closest available combination uses ${formatNumberValue(classesPerWeekUsed, 2)}.`,
    );
  }

  if (pricingMode === PRICING_MODE_TARGET) {
    if (Number.isFinite(bufferPercent) && bufferPercent > 0 && Number.isFinite(bufferedMonthlyNet)) {
      notes.push(
        `Buffered shortfall scenario (${formatFixed(bufferPercent, 1)}% attendance loss) projects ${formatCurrencyOrDash(currency, bufferedMonthlyNet)} net per month.`,
      );
    } else {
      notes.push("Report reflects the base pricing scenario that meets your net income target.");
    }
  } else {
    const manualLessonPriceCount = Array.isArray(inputs?.lessonCostInclVatOptions)
      ? inputs.lessonCostInclVatOptions.filter((value) => Number.isFinite(value) && value >= 0).length
      : 0;
    notes.push(
      manualLessonPriceCount > 1
        ? "Report uses the first manual lesson price from your comma-separated list."
        : "Report uses the manual lesson price you entered.",
    );
  }

  const notesMarkup = notes.length
    ? `<section class="report-section">
            <h2>Notes</h2>
            <ul class="report-list">${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
          </section>`
    : "";

  const summaryItems = [
    { label: "Students per class", value: formatNumberValue(studentsUsed, 2) },
    { label: "Classes per week", value: formatNumberValue(classesPerWeekUsed, 2) },
    { label: "Classes per active month", value: formatNumberValue(classesPerMonth, 2) },
    { label: "Hours per class", value: formatNumberValue(hoursPerClass, 2) },
    { label: "Teaching hours / week", value: formatNumberValue(weeklyHours, 2) },
    { label: "Teaching hours / month", value: formatNumberValue(monthlyHours, 2) },
    { label: "Active months / year", value: formatNumberValue(activeMonths, 2) },
    { label: "Working weeks / active month", value: formatNumberValue(approxWeeksPerActiveMonth, 2) },
    { label: "VAT rate", value: `${formatFixed((inputs?.vatRate ?? 0) * 100, 1)}%` },
    { label: "Income tax rate", value: `${formatFixed(taxRate * 100, 1)}%` },
  ];

  const summaryMarkup = summaryItems
    .map(
      (item) => `
          <div class="summary-item">
            <span class="summary-label">${escapeHtml(item.label)}</span>
            <span class="summary-value">${escapeHtml(item.value)}</span>
          </div>
        `,
    )
    .join("");

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
            `${formatNumberValue(studentsUsed, 2)} students · ${formatNumberValue(classesPerWeekUsed, 2)} classes per week`,
          )}</p>
        </div>
        <div class="report-meta">
          <p><span>Generated</span>${escapeHtml(generatedDisplay)}</p>
          <p><span>Pricing mode</span>${escapeHtml(
            pricingMode === PRICING_MODE_TARGET ? "Target net income (base price)" : "Manual price per student",
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
              <th scope="row">Variable costs — per class</th>
              <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonVariableClass))}</td>
              <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyVariableClass))}</td>
            </tr>
            <tr>
              <th scope="row">Variable costs — per student per class</th>
              <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, perLessonVariableStudent))}</td>
              <td class="numeric">${escapeHtml(formatCurrencyOrDash(currency, monthlyVariableStudent))}</td>
            </tr>
            <tr>
              <th scope="row">Variable costs — per student per month</th>
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
              <td class="numeric">${Number.isFinite(netMargin) ? escapeHtml(`${formatFixed(netMargin, 1)}%`) : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Gross hourly revenue</th>
              <td class="numeric">${Number.isFinite(effectiveHourlyGross) ? escapeHtml(formatCurrencyDetailed(currency, effectiveHourlyGross)) : "—"}</td>
            </tr>
            <tr>
              <th scope="row">Net hourly pay</th>
              <td class="numeric">${Number.isFinite(effectiveHourlyNet) ? escapeHtml(formatCurrencyDetailed(currency, effectiveHourlyNet)) : "—"}</td>
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
