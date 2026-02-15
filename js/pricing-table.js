import { formatCurrency, formatFixed } from "./utils.js";
import { shouldHighlightIncome } from "./calculations.js";

const MONTHS_PER_YEAR = 12;
const PRICING_MODE_TARGET = "target";
const numberFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

function convertNetToGross(value, taxRate) {
  const safeRate = Math.max(0, Math.min(0.95, taxRate));
  return value / (1 - safeRate);
}

export function findBestPricingCombination(studentsTarget, classesPerWeekTarget, pricingData = []) {
  if (!Array.isArray(pricingData) || !pricingData.length) {
    return null;
  }

  const tolerance = 1e-6;
  let bestMatch = null;
  let bestScore = Infinity;

  pricingData.forEach((row) => {
    if (!row || !Array.isArray(row.columns)) {
      return;
    }
    const studentsValue = Number.isFinite(row.students) ? row.students : null;
    row.columns.forEach((column) => {
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
          classDiff,
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
    exactClasses: bestMatch.classDiff < tolerance,
  };
}
export function buildPricingTable(data, symbol, bufferPercent, options = {}) {
  if (!data.length) {
    return `<div class="card"><p class="status-message">No valid combinations available.</p></div>`;
  }

  const {
    mode = PRICING_MODE_TARGET,
    includeBuffer: useBuffer = true,
    showExVat: displayExVat = true,
    showHourlyRate: displayHourly = true,
    showAnnualIncome: displayAnnual = true,
    minLessonPrice = null,
    maxLessonPrice = null,
    acceptableIncome: acceptableIncomeRange = null,
    desiredIncomeDisplayMode: incomeDisplayMode = "net",
    taxRate: incomeTaxRate = 0,
    activeMonths: incomeActiveMonths = MONTHS_PER_YEAR,
    hoursPerLesson: lessonHours = 1,
  } = options;
  const formattedBuffer = formatFixed(bufferPercent, 1);
  const cardClasses = ["card", "pricing-card"];

  const hasPreferredRange = Number.isFinite(minLessonPrice) || Number.isFinite(maxLessonPrice);

  const convertNetIncomeForDisplay = (value) => {
    if (!Number.isFinite(value)) {
      return null;
    }
    return incomeDisplayMode === "gross" ? convertNetToGross(value, incomeTaxRate) : value;
  };

  const formatIncomeForDisplay = (value) => {
    const converted = convertNetIncomeForDisplay(value);
    return Number.isFinite(converted) ? formatCurrency(symbol, converted) : "—";
  };

  const monthlyIncomeLabel = incomeDisplayMode === "gross" ? "Monthly gross" : "Monthly net";
  const annualIncomeLabel = incomeDisplayMode === "gross" ? "Annual gross" : "Annual net";

  const isPriceOutOfRange = (value) => {
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
  const hourlyRateLabel = incomeDisplayMode === "gross" ? "Hourly gross" : "Hourly net";

  const computeHourlyRate = (breakdown) => {
    if (!normalizedLessonHours) {
      return null;
    }
    const netPerLesson = breakdown?.perLesson?.netIncome;
    if (!Number.isFinite(netPerLesson)) {
      return null;
    }
    const lessonValue = incomeDisplayMode === "gross" ? convertNetToGross(netPerLesson, incomeTaxRate) : netPerLesson;
    if (!Number.isFinite(lessonValue)) {
      return null;
    }
    const perHour = lessonValue / normalizedLessonHours;
    return Number.isFinite(perHour) ? perHour : null;
  };

  const formatHourlyRateDisplay = (breakdown) => {
    const rate = computeHourlyRate(breakdown);
    return Number.isFinite(rate) ? formatCurrency(symbol, rate) : "—";
  };

  const variant = useBuffer ? "buffered" : "base";
  const defaultPriceLabel = useBuffer ? `Buffered +${formattedBuffer}%` : "Base price";

  const renderPriceButton = ({
    priceData,
    rowIndex,
    columnIndex,
    priceLabel = defaultPriceLabel,
    manualIndex = null,
    priceSource = "dynamic",
    variantOverride = null,
    compact = false,
  }) => {
    if (!priceData) {
      return "";
    }

    const buttonVariant = variantOverride === "base" || variantOverride === "buffered" ? variantOverride : variant;
    const normalizedPriceSource = priceSource === "manual" ? "manual" : "dynamic";
    const shortfallMultiplier = Math.max(1 - bufferPercent / 100, 0);
    let highlightMonthlyNet = priceData.monthlyNet;
    let highlightAnnualNet = priceData.annualNet;
    let manualBufferImpactMarkup = "";

    if (normalizedPriceSource === "manual" && useBuffer) {
      highlightMonthlyNet = Number.isFinite(priceData.monthlyNet) ? priceData.monthlyNet * shortfallMultiplier : null;
      highlightAnnualNet = Number.isFinite(priceData.annualNet) ? priceData.annualNet * shortfallMultiplier : null;
      const shortfallAnnualDisplay = formatIncomeForDisplay(highlightAnnualNet);
      const shortfallLabel = incomeDisplayMode === "gross" ? "Annual gross" : "Annual net";
      manualBufferImpactMarkup = `<span class="price-tertiary price-tertiary--buffer-impact">${shortfallLabel} -${formattedBuffer}% buffer ${shortfallAnnualDisplay}</span>`;
    }

    const exVat = formatCurrency(symbol, priceData.priceExVat);
    const inclVat = formatCurrency(symbol, priceData.priceInclVat);
    const outOfRange = isPriceOutOfRange(priceData.priceInclVat);
    const highlightIncome = shouldHighlightIncome(
      { monthlyNet: highlightMonthlyNet, annualNet: highlightAnnualNet },
      {
        acceptableIncome: acceptableIncomeRange,
        displayMode: incomeDisplayMode,
        taxRate: incomeTaxRate,
        activeMonths: incomeActiveMonths,
      },
    );
    const priceClasses = ["price-line"];
    if (compact) {
      priceClasses.push("price-line--mini");
    }
    if (outOfRange) {
      priceClasses.push("price-line--out-of-range");
    }
    if (highlightIncome) {
      priceClasses.push("price-line--acceptable");
    }
    const buttonClass = priceClasses.join(" ");
    const annualIncomeDisplay = formatIncomeForDisplay(priceData.annualNet);
    const hourlyDisplay = formatHourlyRateDisplay(priceData.breakdown);
    const valueClass = outOfRange ? "price-value price-value--out-of-range" : "price-value";
    const exVatMarkup = displayExVat ? `<span class="price-secondary">ex VAT ${exVat}</span>` : "";
    const hourlyMarkup = displayHourly ? `<span class="price-tertiary">${hourlyRateLabel} ${hourlyDisplay}</span>` : "";
    const annualMarkup = displayAnnual ? `<span class="price-secondary">${annualIncomeLabel} ${annualIncomeDisplay}</span>` : "";
    const manualIndexAttribute = Number.isInteger(manualIndex) ? ` data-manual-index="${manualIndex}"` : "";

    return `
          <button
            type="button"
            class="${buttonClass}"
            data-row="${rowIndex}"
            data-column="${columnIndex}"
            data-variant="${buttonVariant}"
            data-price-source="${normalizedPriceSource}"${manualIndexAttribute}
          >
            <span class="price-label">${priceLabel}</span>
            <strong class="${valueClass}">${inclVat}</strong>
            ${exVatMarkup}
            ${hourlyMarkup}
            ${annualMarkup}
            ${manualBufferImpactMarkup}
          </button>
        `;
  };

  const bufferTooltip =
    "Dynamic target-based suggested price is boosted by the buffer to compensate potential shortfall and help achieve desired income. Fixed prices do not change when buffer is on. Instead, each fixed-price square shows an annual shortfall line (Annual ... -X% buffer), and that shortfall value drives acceptable-income highlighting.";
  const toggleMarkup = `<div class="price-display-toggles">
            <label class="display-toggle">
              <input type="checkbox" class="display-toggle-checkbox" data-toggle="exVat" ${displayExVat ? "checked" : ""} />
              <span>ex VAT</span>
            </label>
            <label class="display-toggle">
              <input type="checkbox" class="display-toggle-checkbox" data-toggle="hourly" ${displayHourly ? "checked" : ""} />
              <span>${hourlyRateLabel}</span>
            </label>
            <label class="display-toggle">
              <input type="checkbox" class="display-toggle-checkbox" data-toggle="annual" ${displayAnnual ? "checked" : ""} />
              <span>${annualIncomeLabel}</span>
            </label>
            <label class="display-toggle display-toggle--buffer">
              <input type="checkbox" class="buffer-toggle-checkbox" ${useBuffer ? "checked" : ""} />
              <span>Include buffer in target price (+${formattedBuffer}%)</span>
              <span class="info-icon info-icon--tooltip-right" tabindex="0" role="button" aria-expanded="false"
                aria-label="${bufferTooltip}" data-tooltip="${bufferTooltip}"><svg class="icon">
                  <use href="#icon-info"></use>
                </svg></span>
            </label>
          </div>`;

  const columnHeaders = data[0].columns
    .map((col) => {
      return `<th scope="col">${col.classesPerWeek}/week<span class="sub-label">≈ ${numberFormatter.format(col.classesPerYear)} / yr</span></th>`;
    })
    .join("");

  const rowsHtml = data
    .map((row, rowIndex) => {
      const cells = row.columns
        .map((col, columnIndex) => {
          const dynamicPriceData = useBuffer ? col.buffered : col.base;
          const hasManualOptions = Array.isArray(col.manualOptions) && col.manualOptions.length > 0;
          let manualOptionsMarkup = "";
          if (hasManualOptions) {
            const manualOptionButtons = col.manualOptions
              .map((manualOption, manualIndex) => {
                const priceData = manualOption.base;
                return renderPriceButton({
                  priceData,
                  rowIndex,
                  columnIndex,
                  priceLabel: `Price ${manualIndex + 1}`,
                  manualIndex,
                  priceSource: "manual",
                  variantOverride: "base",
                  compact: true,
                });
              })
              .join("");
            manualOptionsMarkup = `<div class="price-line-group">${manualOptionButtons}</div>`;
          }
          return `
                <td>
                  <div class="price-pair">
                    ${renderPriceButton({
                      priceData: dynamicPriceData,
                      rowIndex,
                      columnIndex,
                      priceSource: "dynamic",
                    })}
                    ${manualOptionsMarkup}
                  </div>
                </td>
              `;
        })
        .join("");
      return `<tr><th scope="row">${row.students}<span class="sub-label">students</span></th>${cells}</tr>`;
    })
    .join("");

  return `
        <div class="${cardClasses.join(" ")}">
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
