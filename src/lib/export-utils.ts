/**
 * Unified Ultra-Compact Single-Page Export Utilities for NoblecleanOps
 * Generates Excel-compatible CSVs (with UTF-8 BOM) and single-page print-optimized PDFs across all Admin tabs.
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
 * Single-Page Compact Executive PDF Export with Dense Table Layout
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

  const nowStr = new Date().toLocaleDateString("de-DE") + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  const kpisHtml = kpiCards && kpiCards.length > 0 ? `
    <div style="display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap;">
      ${kpiCards.map(k => `
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 8.5px; font-weight: 800; text-transform: uppercase; color: #64748b;">${k.label}:</span>
          <span style="font-size: 11px; font-weight: 900; color: #025669;">${k.value}</span>
          ${k.sub ? `<span style="font-size: 8.5px; color: #475569; font-weight: 600;">(${k.sub})</span>` : ""}
        </div>
      `).join("")}
    </div>
  ` : "";

  const tableHeaders = headers.map((h) => `<th style="padding: 5px 8px; background-color: #025669; color: #ffffff; font-weight: 800; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px;">${h}</th>`).join("");

  const formatCell = (val: unknown) => {
    if (val === null || val === undefined || val === "") return `<span style="color: #94a3b8;">—</span>`;
    const str = String(val);
    if (str === "Aktiv" || str === "Erledigt" || str === "Zugewiesen") {
      return `<span style="background-color: #dcfce7; color: #166534; font-weight: 800; padding: 1px 6px; border-radius: 4px; font-size: 8.5px; border: 1px solid #bbf7d0;">${str}</span>`;
    }
    if (str === "In Bearbeitung" || str === "Laufend") {
      return `<span style="background-color: #e0f2fe; color: #0369a1; font-weight: 800; padding: 1px 6px; border-radius: 4px; font-size: 8.5px; border: 1px solid #bae6fd;">${str}</span>`;
    }
    if (str === "Beendet" || str === "Offen" || str === "Inaktiv") {
      return `<span style="background-color: #fef2f2; color: #991b1b; font-weight: 800; padding: 1px 6px; border-radius: 4px; font-size: 8.5px; border: 1px solid #fecaca;">${str}</span>`;
    }
    return str;
  };

  const tableRows = rows
    .map(
      (r, idx) =>
        `<tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0;">
          ${r.map((cell) => `<td style="padding: 4px 8px; text-align: left; color: #1e293b; font-size: 9px;">${formatCell(cell)}</td>`).join("")}
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
        @page { size: A4 landscape; margin: 6mm 8mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 6px; color: #0f172a; background-color: #ffffff; margin: 0; }
        .header { border-bottom: 2px solid #025669; padding-bottom: 4px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: flex-end; }
        .brand { font-size: 15px; font-weight: 900; color: #025669; letter-spacing: -0.3px; }
        .title { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 1px; }
        .subtitle { font-size: 9px; color: #64748b; margin-top: 1px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9px; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
        .footer { margin-top: 8px; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">NOBLECLEAN <span style="font-size: 9px; color: #c8a951; font-weight: 800; margin-left: 4px;">MANAGEMENT SYSTEM</span></div>
          <div class="title">${title}</div>
          <div class="subtitle">${subtitle}</div>
        </div>
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-align: right;">
          <div>Export: ${nowStr}</div>
          <div style="color: #025669;">Einträge: ${rows.length}</div>
        </div>
      </div>

      ${kpisHtml}

      <table>
        <thead>
          <tr>${tableHeaders}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <div class="footer">
        <span>Erstellt durch NoblecleanOps Management Platform</span>
        <span>Vertraulicher Management-Bericht</span>
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
 * Ultra-Compact Single-Page Monthly Schedule PDF Exporter
 * Fits an entire 31-day month schedule onto EXACTLY 1 A4 Landscape page.
 * Groups working employees inline for each day with shift times and hours.
 */
export function exportSchedulePDF(
  monthLabel: string,
  schedules: readonly ScheduleExportItem[]
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const nowStr = new Date().toLocaleDateString("de-DE") + " " + new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });

  // Group schedules by workDate
  const map = new Map<string, ScheduleExportItem[]>();
  schedules.forEach((item) => {
    if (!map.has(item.workDate)) map.set(item.workDate, []);
    map.get(item.workDate)!.push(item);
  });

  const sortedDates = Array.from(map.keys()).sort();

  // Stats
  const totalShifts = schedules.length;
  const totalHours = schedules.reduce((sum, s) => sum + s.allocatedHours, 0);
  const uniqueWorkers = new Set(schedules.map((s) => s.employeeName)).size;
  const uniqueClients = new Set(schedules.map((s) => s.clientName)).size;

  const formatShortDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const dayNum = String(date.getDate()).padStart(2, "0");
      const monthNum = String(date.getMonth() + 1).padStart(2, "0");
      const weekDay = date.toLocaleDateString("de-DE", { weekday: "short" });
      return `${dayNum}.${monthNum} (${weekDay})`;
    } catch {
      return dateStr;
    }
  };

  const isWeekend = (dateStr: string) => {
    try {
      const day = new Date(dateStr).getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    } catch {
      return false;
    }
  };

  const rowsHtml = sortedDates
    .map((dateStr, idx) => {
      const dayShifts = map.get(dateStr)!;
      const dayTotalHours = dayShifts.reduce((sum, s) => sum + s.allocatedHours, 0);
      const weekend = isWeekend(dateStr);
      const dateFormatted = formatShortDate(dateStr);

      const chipsHtml = dayShifts
        .map(
          (s) => `
          <span style="display: inline-flex; align-items: center; gap: 4px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; padding: 1px 6px; font-size: 8.5px; font-weight: 600; margin: 1px 2px;">
            <strong style="color: #0f172a;">${s.employeeName}</strong>
            <span style="color: #025669; font-weight: 700;">(${s.startTime || "04:00"}-${s.endTime || "07:00"})</span>
            <span style="color: #047857; font-weight: 800; background-color: #d1fae5; padding: 0 4px; border-radius: 3px;">${s.allocatedHours}h</span>
          </span>
        `
        )
        .join("");

      return `
        <tr style="background-color: ${weekend ? "#fffbeb" : idx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 3px 6px; font-weight: 800; color: ${weekend ? "#b45309" : "#0f172a"}; font-size: 9px; white-space: nowrap;">
            ${weekend ? "⭐ " : ""}${dateFormatted}
          </td>
          <td style="padding: 3px 6px;">
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 2px;">
              ${chipsHtml}
            </div>
          </td>
          <td style="padding: 3px 6px; text-align: center; font-weight: 800; color: #025669; font-size: 9px;">
            ${dayShifts.length}
          </td>
          <td style="padding: 3px 6px; text-align: right; font-weight: 900; color: #047857; font-size: 9px; white-space: nowrap;">
            ${dayTotalHours} Std.
          </td>
        </tr>
      `;
    })
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <title>Monats-Schichtplan (${monthLabel})</title>
      <style>
        @page { size: A4 landscape; margin: 6mm 8mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 4px; color: #0f172a; background-color: #ffffff; margin: 0; }
        .header { border-bottom: 2px solid #025669; padding-bottom: 4px; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: flex-end; }
        .brand { font-size: 15px; font-weight: 900; color: #025669; letter-spacing: -0.3px; }
        .title { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 1px; }
        
        .stats-bar { display: flex; gap: 10px; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; margin-bottom: 4px; font-size: 8.5px; font-weight: 700; align-items: center; justify-content: space-around; }
        .stat-item { display: flex; gap: 4px; align-items: center; }
        .stat-val { font-size: 11px; font-weight: 900; color: #025669; }

        table { width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #cbd5e1; border-radius: 4px; overflow: hidden; }
        th { background-color: #025669; color: #ffffff; font-weight: 800; text-transform: uppercase; font-size: 8.5px; padding: 4px 6px; letter-spacing: 0.3px; }

        .footer { margin-top: 6px; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 3px; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">NOBLECLEAN <span style="font-size: 9px; color: #c8a951; font-weight: 800; margin-left: 4px;">OPERATIONAL MANAGEMENT</span></div>
          <div class="title">Monats-Schichtplan — ${monthLabel}</div>
        </div>
        <div style="font-size: 8.5px; font-weight: 700; color: #64748b; text-align: right;">
          <div>Exportiert: ${nowStr}</div>
          <div style="color: #025669; font-weight: 800;">Kompakt-Druckansicht (1 Seite A4)</div>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat-item"><span>Gesamte Schichten:</span> <span class="stat-val">${totalShifts}</span></div>
        <div class="stat-item"><span>Gesamtstunden:</span> <span class="stat-val" style="color: #047857;">${totalHours} Std.</span></div>
        <div class="stat-item"><span>Eingesetzte Mitarbeiter:</span> <span class="stat-val" style="color: #4f46e5;">${uniqueWorkers}</span></div>
        <div class="stat-item"><span>Betreute Objekte/Kunden:</span> <span class="stat-val" style="color: #d97706;">${uniqueClients}</span></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 85px; text-align: left;">Datum & Tag</th>
            <th style="text-align: left;">Eingesetzte Mitarbeiter & Schichten (Zeiten & Stunden)</th>
            <th style="width: 65px; text-align: center;">Mitarbeiter</th>
            <th style="width: 75px; text-align: right;">Gesamt Std.</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <span>Erstellt durch NoblecleanOps Management Platform</span>
        <span>Offizieller Schichtplan für den Einsatzbetrieb</span>
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
