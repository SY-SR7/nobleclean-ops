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
 * Clean Centered A4 PDF Export for Reports and Lists
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

  const tableHeaders = headers.map((h) => `<th style="padding: 6px 8px; border: 1px solid #000000; background-color: #ffffff; color: #000000; font-weight: 700; text-align: left; font-size: 10px;">${h}</th>`).join("");

  const tableRows = rows
    .map(
      (r) =>
        `<tr>
          ${r.map((cell) => `<td style="padding: 4px 8px; border: 1px solid #000000; text-align: left; color: #000000; font-size: 9.5px; vertical-align: top;">${cell ?? "—"}</td>`).join("")}
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
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #000000; background-color: #ffffff; }
        .table-container { width: 100%; margin: 0 auto; }
        table { width: 100%; border-collapse: collapse; font-size: 9.5px; border: 1.5px solid #000000; }
        th { border: 1px solid #000000; padding: 5px 8px; background-color: #ffffff; color: #000000; font-weight: 700; text-align: left; font-size: 10px; }
        td { border: 1px solid #000000; padding: 4px 8px; vertical-align: top; }
      </style>
    </head>
    <body>
      <div class="table-container">
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
 * Minimal Clean A4 Portrait Schedule PDF Exporter
 * 5 Columns: Datum | Wochentag | Mitarbeiter | Beginn | Ende
 * Matches exact dimensions, centered alignment, and single-page A4 printing.
 */
export function exportSchedulePDF(
  monthLabel: string,
  schedules: readonly ScheduleExportItem[]
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  // Group schedules by workDate
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

  const rowsHtml = sortedDates
    .map((dateStr) => {
      const rawShifts = map.get(dateStr)!;

      // Count occurrences of each employee on this date
      const counts = new Map<string, number>();
      rawShifts.forEach((s) => {
        counts.set(s.employeeName, (counts.get(s.employeeName) || 0) + 1);
      });

      // Process unique employees on this date with their shift times
      const employees: { name: string; start: string; end: string }[] = [];
      const seenNames = new Set<string>();

      rawShifts.forEach((s) => {
        if (!seenNames.has(s.employeeName)) {
          seenNames.add(s.employeeName);
          const isDouble = (counts.get(s.employeeName) || 0) >= 2;
          const isSaturday = new Date(dateStr).getDay() === 6;

          let start = "04:00";
          let end = "07:00";

          if (isSaturday) {
            start = "05:30";
            end = "08:30";
          } else if (isDouble) {
            start = "01:00";
            end = "07:00";
          }

          employees.push({ name: s.employeeName, start, end });
        }
      });

      const dateFormatted = formatDateDDMMYYYY(dateStr);
      const wochentag = getGermanWochentag(dateStr);

      const namesHtml = employees.map((e) => `<div>${e.name}</div>`).join("");
      const startTimesHtml = employees.map((e) => `<div>${e.start}</div>`).join("");
      const endTimesHtml = employees.map((e) => `<div>${e.end}</div>`).join("");

      return `
        <tr>
          <td style="padding: 4px 8px; border: 1px solid #000000; font-size: 9.5px; font-weight: 500;">${dateFormatted}</td>
          <td style="padding: 4px 8px; border: 1px solid #000000; font-size: 9.5px; font-weight: 500;">${wochentag}</td>
          <td style="padding: 4px 8px; border: 1px solid #000000; font-size: 9.5px; font-weight: 500;">${namesHtml}</td>
          <td style="padding: 4px 8px; border: 1px solid #000000; font-size: 9.5px; font-weight: 500; text-align: center;">${startTimesHtml}</td>
          <td style="padding: 4px 8px; border: 1px solid #000000; font-size: 9.5px; font-weight: 500; text-align: center;">${endTimesHtml}</td>
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
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #000000;
        }
        .table-container {
          width: 100%;
          margin: 0 auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9.5px;
          border: 1.5px solid #000000;
        }
        th {
          border: 1px solid #000000;
          padding: 5px 8px;
          background-color: #ffffff;
          color: #000000;
          font-weight: 700;
          text-align: left;
          font-size: 10px;
        }
        td {
          border: 1px solid #000000;
          padding: 4px 8px;
          vertical-align: top;
        }
      </style>
    </head>
    <body>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 18%;">Datum</th>
              <th style="width: 18%;">Wochentag</th>
              <th style="width: 40%;">Mitarbeiter</th>
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
