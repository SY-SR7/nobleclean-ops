/**
 * Unified Executive Export Utilities for NoblecleanOps
 * Generates Excel-compatible CSVs (with UTF-8 BOM) and high-end printable PDFs across all Admin tabs.
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
 * Standard Executive PDF Export with KPI Summary Header and Styled Tables
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
    <div style="display: grid; grid-template-columns: repeat(${Math.min(kpiCards.length, 4)}, 1fr); gap: 12px; margin-bottom: 20px;">
      ${kpiCards.map(k => `
        <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px 14px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; tracking-wide: 0.5px;">${k.label}</div>
          <div style="font-size: 18px; font-weight: 800; color: #025669; margin-top: 2px;">${k.value}</div>
          ${k.sub ? `<div style="font-size: 9px; color: #475569; font-weight: 600;">${k.sub}</div>` : ""}
        </div>
      `).join("")}
    </div>
  ` : "";

  const tableHeaders = headers.map((h) => `<th style="padding: 10px 12px; background-color: #025669; color: #ffffff; font-weight: 800; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${h}</th>`).join("");

  const formatCell = (val: unknown) => {
    if (val === null || val === undefined || val === "") return `<span style="color: #94a3b8;">—</span>`;
    const str = String(val);
    if (str === "Aktiv" || str === "Erledigt" || str === "Zugewiesen") {
      return `<span style="background-color: #dcfce7; color: #166534; font-weight: 700; padding: 3px 8px; border-radius: 9999px; font-size: 10px; border: 1px solid #bbf7d0;">${str}</span>`;
    }
    if (str === "In Bearbeitung" || str === "Laufend") {
      return `<span style="background-color: #e0f2fe; color: #0369a1; font-weight: 700; padding: 3px 8px; border-radius: 9999px; font-size: 10px; border: 1px solid #bae6fd;">${str}</span>`;
    }
    if (str === "Beendet" || str === "Offen" || str === "Inaktiv") {
      return `<span style="background-color: #fef2f2; color: #991b1b; font-weight: 700; padding: 3px 8px; border-radius: 9999px; font-size: 10px; border: 1px solid #fecaca;">${str}</span>`;
    }
    return str;
  };

  const tableRows = rows
    .map(
      (r, idx) =>
        `<tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #e2e8f0;">
          ${r.map((cell) => `<td style="padding: 10px 12px; text-align: left; color: #1e293b; font-size: 11px;">${formatCell(cell)}</td>`).join("")}
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
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 15px; color: #0f172a; background-color: #ffffff; }
        .header { border-bottom: 3px solid #025669; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
        .brand { font-size: 20px; font-weight: 900; color: #025669; letter-spacing: -0.5px; }
        .title { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 3px; }
        .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
        .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">NOBLECLEAN <span style="font-size: 12px; color: #c8a951; font-weight: 700; margin-left: 6px;">MANAGEMENT SYSTEM</span></div>
          <div class="title">${title}</div>
          <div class="subtitle">${subtitle}</div>
        </div>
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-align: right;">
          <div>Exportiert am: ${nowStr}</div>
          <div style="color: #025669; margin-top: 2px;">Gesamt: ${rows.length} Einträge</div>
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
          setTimeout(function() { window.print(); }, 200);
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
 * High-End Day-by-Day Grouped Schedule PDF Export
 * Groups worker shifts day-by-day with clean daily cards, staffing count, total daily hours, and worker pills.
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

  const formatDayTitle = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const daysHtml = sortedDates
    .map((dateStr) => {
      const dayShifts = map.get(dateStr)!;
      const dayTotalHours = dayShifts.reduce((sum, s) => sum + s.allocatedHours, 0);
      const dayTitle = formatDayTitle(dateStr);

      const rowsHtml = dayShifts
        .map(
          (s, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"}; border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 9999px; background-color: #025669; color: white; font-size: 10px; font-weight: 800; margin-right: 8px;">${getInitials(s.employeeName)}</span>
            ${s.employeeName}
          </td>
          <td style="padding: 8px 12px; font-weight: 600; color: #334155;">
            🏢 ${s.clientName}
          </td>
          <td style="padding: 8px 12px; font-weight: 600; color: #475569;">
            ⏰ ${s.startTime || "04:00"} – ${s.endTime || "07:00"}
          </td>
          <td style="padding: 8px 12px; text-align: right;">
            <span style="background-color: #ecfdf5; color: #047857; font-weight: 800; padding: 4px 10px; border-radius: 8px; border: 1px solid #a7f3d0; font-size: 11px;">
              ${s.allocatedHours} Std.
            </span>
          </td>
        </tr>
      `
        )
        .join("");

      return `
      <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); break-inside: avoid;">
        <div style="background: linear-gradient(to right, #025669, #0f766e); padding: 10px 16px; color: white; display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 13px; font-weight: 800; letter-spacing: -0.2px;">
            📅 ${dayTitle}
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="background-color: rgba(255,255,255,0.2); font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 9999px;">
              👥 ${dayShifts.length} Mitarbeiter
            </span>
            <span style="background-color: #c8a951; color: #0f172a; font-size: 10px; font-weight: 800; padding: 3px 10px; border-radius: 9999px;">
              ⚡ ${dayTotalHours} Std. Gesamt
            </span>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-size: 10px; color: #64748b; font-weight: 800;">
              <th style="padding: 8px 12px; text-align: left;">Mitarbeiter</th>
              <th style="padding: 8px 12px; text-align: left;">Objekt / Kunde</th>
              <th style="padding: 8px 12px; text-align: left;">Schicht-Zeitraum</th>
              <th style="padding: 8px 12px; text-align: right;">Stunden</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
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
        @page { size: A4 landscape; margin: 12mm; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 15px; color: #0f172a; background-color: #f8fafc; }
        .header { background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px 20px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .brand { font-size: 22px; font-weight: 900; color: #025669; letter-spacing: -0.5px; }
        .title { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
        .stat-card { background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 14px; padding: 10px 14px; text-align: center; box-shadow: 0 1px 2px rgba(0,0,0,0.03); }
        .stat-label { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
        .stat-value { font-size: 20px; font-weight: 900; color: #025669; margin-top: 2px; }
        .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; border-top: 1px solid #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">NOBLECLEAN <span style="font-size: 11px; color: #c8a951; font-weight: 800; margin-left: 6px;">MANAGEMENT SYSTEM</span></div>
          <div class="title">Monats-Schichtplan — ${monthLabel}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px; font-weight: 500;">Tagesgenaue Übersicht aller zugewiesenen Schichten und Arbeitszeiten</div>
        </div>
        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-align: right;">
          <div>Gedruckt am: ${nowStr}</div>
          <div style="color: #025669; margin-top: 2px; font-weight: 800;">Status: Freigegebener Einsatzplan</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Gesamte Schichten</div>
          <div class="stat-value">${totalShifts}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Gesamtstunden</div>
          <div class="stat-value" style="color: #047857;">${totalHours} Std.</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Eingesetzte Mitarbeiter</div>
          <div class="stat-value" style="color: #4f46e5;">${uniqueWorkers}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Betreute Kunden/Objekte</div>
          <div class="stat-value" style="color: #d97706;">${uniqueClients}</div>
        </div>
      </div>

      ${daysHtml}

      <div class="footer">
        <span>Erstellt durch NoblecleanOps Management Platform</span>
        <span>Offizieller Schichtplan für den Einsatzbetrieb</span>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() { window.print(); }, 200);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
