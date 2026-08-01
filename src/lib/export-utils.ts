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
 * Minimal Clean Ultra-Compact Centered A4 Portrait Schedule PDF Exporter
 * 5 Columns: Datum | Wochentag | Mitarbeiter | Beginn | Ende
 * Takes exact schedule array rendered in system with zero modifications, matching system UI brand theme & colors.
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

  const formatDateDDMMYYYY = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}.${parts[1]}.${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const getGermanWochentag = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("de-DE", { weekday: "long" });
    } catch {
      return "";
    }
  };

  const clientName = schedules[0]?.clientName || "John Reed Fitness";

  const rowsHtml = sortedDates
    .map((dateStr, idx) => {
      const rawShifts = map.get(dateStr)!;

      const dateFormatted = formatDateDDMMYYYY(dateStr);
      const wochentag = getGermanWochentag(dateStr);

      const namesHtml = rawShifts.map((s) => `<div style="line-height: 1.15; margin: 0; padding: 0;">${s.employeeName}</div>`).join("");
      const startTimesHtml = rawShifts.map((s) => `<div style="line-height: 1.15; margin: 0; padding: 0;">${s.startTime || "04:00"}</div>`).join("");
      const endTimesHtml = rawShifts.map((s) => `<div style="line-height: 1.15; margin: 0; padding: 0;">${s.endTime || "07:00"}</div>`).join("");

      return `
        <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
          <td style="padding: 2px 6px; border: 1px solid #cbd5e1; font-size: 8px; font-weight: 600; color: #0f172a; line-height: 1.15;">${dateFormatted}</td>
          <td style="padding: 2px 6px; border: 1px solid #cbd5e1; font-size: 8px; font-weight: 600; color: #0f172a; line-height: 1.15;">${wochentag}</td>
          <td style="padding: 2px 6px; border: 1px solid #cbd5e1; font-size: 8px; font-weight: 700; color: #0f172a; line-height: 1.15;">${namesHtml}</td>
          <td style="padding: 2px 6px; border: 1px solid #cbd5e1; font-size: 8px; font-weight: 600; color: #025669; text-align: center; line-height: 1.15;">${startTimesHtml}</td>
          <td style="padding: 2px 6px; border: 1px solid #cbd5e1; font-size: 8px; font-weight: 600; color: #025669; text-align: center; line-height: 1.15;">${endTimesHtml}</td>
        </tr>
      `;
    })
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Schichtplan ${monthLabel}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #0f172a;
        }
        .table-container {
          width: 70%;
          margin: 0 auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8px;
          line-height: 1.15;
          border: 1.5px solid #025669;
        }
        th {
          border: 1px solid #025669;
          padding: 4px 6px;
          background-color: #025669;
          color: #ffffff;
          font-weight: 800;
          text-align: left;
          font-size: 8.5px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        td {
          border: 1px solid #cbd5e1;
          padding: 2px 6px;
          vertical-align: top;
        }
      </style>
    </head>
    <body>
      <div class="table-container">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #025669; padding-bottom: 4px; margin-bottom: 6px;">
          <div>
            <div style="font-size: 14px; font-weight: 900; letter-spacing: -0.3px; color: #025669;">NOBLECLEAN <span style="font-size: 9px; color: #c8a951; font-weight: 800; margin-left: 4px;">MANAGEMENT SYSTEM</span></div>
            <div style="font-size: 8.5px; color: #64748b; font-weight: 600; margin-top: 1px;">Monats-Schichtplan · ${monthLabel}</div>
          </div>
          <div style="font-size: 8.5px; font-weight: 700; color: #025669;">
            🏢 ${clientName}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 20%;">Datum</th>
              <th style="width: 20%;">Wochentag</th>
              <th style="width: 36%;">Mitarbeiter</th>
              <th style="width: 12%; text-align: center;">Beginn</th>
              <th style="width: 12%; text-align: center;">Ende</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
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
