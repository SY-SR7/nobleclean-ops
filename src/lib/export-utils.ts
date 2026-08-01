/**
 * Unified Minimal Single-Page Export Utilities for NoblecleanOps
 * Generates Excel-compatible CSVs (with UTF-8 BOM) and clean, centered A4 print-optimized PDFs across all Admin tabs.
 */

export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
) {
  const sanitize = (val: unknown) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvLines = [
    headers.map(sanitize).join(","),
    ...rows.map((row) => row.map(sanitize).join(",")),
  ];

  // \uFEFF for UTF-8 BOM so Microsoft Excel reads German umlauts & Arabic perfectly
  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export type PdfKpiCard = Readonly<{
  label: string;
  value: string | number;
  sub?: string;
}>;

/**
 * Clean Centered A4 PDF Export for Reports and Lists matching System UI palette
 */
export function exportToPDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  filename: string,
  kpiCards?: readonly PdfKpiCard[]
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const tableHeaders = headers.map((h) => `<th style="padding: 4px 6px; border: 1px solid #cbd5e1; background-color: #025669; color: #ffffff; font-weight: 700; text-align: left; font-size: 8.5px;">${h}</th>`).join("");

  const tableRows = rows
    .map(
      (r, idx) =>
        `<tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
          ${r.map((cell) => `<td style="padding: 2px 6px; border: 1px solid #cbd5e1; text-align: left; color: #0f172a; font-size: 8px; vertical-align: top;">${cell ?? "—"}</td>`).join("")}
        </tr>`
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; color: #0f172a; background-color: #ffffff; }
        .table-container { width: 70%; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; font-size: 8px; line-height: 1.1; border: 1.5px solid #025669; }
        th { border: 1px solid #025669; padding: 3px 5px; background-color: #025669; color: #ffffff; font-weight: 700; text-align: left; font-size: 8.5px; }
        td { border: 1px solid #cbd5e1; padding: 2px 6px; vertical-align: top; }
      </style>
    </head>
    <body>
      <div class="table-container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #025669; padding-bottom: 4px; margin-bottom: 6px;">
          <div>
            <div style="font-size: 14px; font-weight: 900; letter-spacing: -0.3px; color: #025669;">NOBLECLEAN <span style="font-size: 9px; color: #c8a951; font-weight: 800; margin-left: 4px;">MANAGEMENT SYSTEM</span></div>
            <div style="font-size: 8.5px; color: #64748b; font-weight: 600; margin-top: 1px;">${title}</div>
          </div>
          <div style="font-size: 8.5px; font-weight: 700; color: #025669;">
            ${subtitle}
          </div>
        </div>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 150);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export type ScheduleExportItem = Readonly<{
  workDate: string;
  employeeName: string;
  clientName: string;
  startTime?: string;
  endTime?: string;
  allocatedHours: number;
}>;

/**
 * Graphical Weekly Card Grid PDF Exporter
 * 100% 1-to-1 match with System Web UI Weekly Grid View
 * Renders Week Blocks (WOCHE 1 - WOCHE 5) with 7-day card grids, avatar badges, green hour pills, and shift timings.
 */
export function exportSchedulePDF(
  monthLabel: string,
  schedules: readonly ScheduleExportItem[]
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  // Group schedules by workDate dynamically from input data
  const map = new Map<string, ScheduleExportItem[]>();
  schedules.forEach((item) => {
    if (!map.has(item.workDate)) map.set(item.workDate, []);
    map.get(item.workDate)!.push(item);
  });

  const sortedDates = Array.from(map.keys()).sort();

  // Group sorted dates into 7-day week chunks
  const weeks: string[][] = [];
  for (let i = 0; i < sortedDates.length; i += 7) {
    weeks.push(sortedDates.slice(i, i + 7));
  }

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const dayName = d.toLocaleDateString("de-DE", { weekday: "short" });
      const parts = dateStr.split("-");
      return `${dayName}., ${parts[2]}.${parts[1]}.`;
    } catch {
      return dateStr;
    }
  };

  const getWeekHeaderRange = (dates: string[]) => {
    if (dates.length === 0) return "";
    const first = dates[0];
    const last = dates[dates.length - 1];
    return `${formatShortDate(first)} – ${formatShortDate(last)}`;
  };

  const avatarColors: Record<string, string> = {
    M: "#6366f1",
    E: "#0284c7",
    H: "#8b5cf6",
    S: "#ec4899",
    A: "#059669",
    K: "#d97706",
  };

  const weeksHtml = weeks
    .map((weekDates, weekIdx) => {
      let weekTotalHours = 0;
      weekDates.forEach((d) => {
        const shifts = map.get(d) || [];
        shifts.forEach((s) => {
          weekTotalHours += s.allocatedHours || 3;
        });
      });

      const weekRangeStr = getWeekHeaderRange(weekDates);

      const daysCardsHtml = weekDates
        .map((dateStr) => {
          const rawShifts = map.get(dateStr) || [];
          const dateShort = formatShortDate(dateStr);
          let dayHours = 0;
          rawShifts.forEach((s) => {
            dayHours += s.allocatedHours || 3;
          });

          const shiftsHtml = rawShifts
            .map((s) => {
              const initial = (s.employeeName || "M")[0].toUpperCase();
              const bg = avatarColors[initial] || "#4f46e5";
              const start = s.startTime || "04:00";
              const end = s.endTime || "07:00";

              return `
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 2px 3px; margin-bottom: 2.5px;">
                  <div style="display: flex; align-items: center; gap: 3px; font-size: 7.5px; font-weight: 700; color: #0f172a;">
                    <span style="width: 11px; height: 11px; border-radius: 50%; background-color: ${bg}; color: #ffffff; font-size: 6.5px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;">${initial}</span>
                    <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.employeeName}</span>
                  </div>
                  <div style="font-size: 6.5px; color: #0284c7; font-weight: 600; margin-top: 1px; padding-left: 14px;">
                    🕒 ${start} - ${end}
                  </div>
                </div>
              `;
            })
            .join("");

          return `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px; background-color: #ffffff; display: flex; flex-direction: column;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; font-size: 7.5px; font-weight: 700; color: #0f172a;">
                <span>${dateShort}</span>
                <span style="background-color: #dcfce7; color: #166534; font-size: 6.5px; font-weight: 800; padding: 0.5px 3px; border-radius: 3px;">${dayHours}h</span>
              </div>
              <div style="flex: 1;">
                ${shiftsHtml}
              </div>
            </div>
          `;
        })
        .join("");

      return `
        <div style="margin-bottom: 8px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8px; font-weight: 800; color: #025669; margin-bottom: 3px; padding: 2px 5px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px;">
            <span>📅 WOCHE ${weekIdx + 1} (${weekRangeStr})</span>
            <span style="font-weight: 800; color: #166534;">Gesamt: ${weekTotalHours} Std.</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(${weekDates.length}, 1fr); gap: 3px;">
            ${daysCardsHtml}
          </div>
        </div>
      `;
    })
    .join("");

  const clientName = schedules[0]?.clientName || "John Reed Fitness";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Schichtplan ${monthLabel}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 6mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #0f172a;
        }
        .page-wrapper {
          width: 100%;
        }
      </style>
    </head>
    <body>
      <div class="page-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #025669; padding-bottom: 3px; margin-bottom: 8px;">
          <div>
            <div style="font-size: 13px; font-weight: 900; letter-spacing: -0.3px; color: #025669;">NOBLECLEAN <span style="font-size: 8.5px; color: #c8a951; font-weight: 800; margin-left: 4px;">MANAGEMENT SYSTEM</span></div>
            <div style="font-size: 8px; color: #64748b; font-weight: 600; margin-top: 1px;">Monats-Schichtplan · ${monthLabel}</div>
          </div>
          <div style="font-size: 8px; font-weight: 700; color: #025669;">
            🏢 ${clientName}
          </div>
        </div>
        ${weeksHtml}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 150);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
