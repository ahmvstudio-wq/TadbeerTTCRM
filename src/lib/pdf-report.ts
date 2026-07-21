// PDF Report Generator using browser print
export function generatePdfReport(data: {
  title: string;
  subtitle?: string;
  stats?: { label: string; value: string | number }[];
  sections: { title: string; headers: string[]; rows: (string | number)[][] }[];
  footer?: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', Arial, sans-serif; color: #1a1a1a; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0D4F4F; padding-bottom: 20px; }
    .header h1 { font-size: 24px; color: #0D4F4F; margin-bottom: 4px; }
    .header p { font-size: 12px; color: #6b7280; }
    .stats { display: flex; gap: 16px; margin-bottom: 30px; flex-wrap: wrap; }
    .stat-card { flex: 1; min-width: 120px; background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; border: 1px solid #e2e8f0; }
    .stat-value { font-size: 20px; font-weight: 700; color: #0D4F4F; }
    .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 14px; color: #0D4F4F; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #0D4F4F; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8f9fa; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${data.title}</h1>
    ${data.subtitle ? `<p>${data.subtitle}</p>` : ""}
    <p style="margin-top:4px">Generated: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
  </div>
  ${data.stats ? `<div class="stats">${data.stats.map((s) => `<div class="stat-card"><div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div></div>`).join("")}</div>` : ""}
  ${data.sections.map((s) => `
    <div class="section">
      <h2>${s.title}</h2>
      <table>
        <thead><tr>${s.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${s.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `).join("")}
  ${data.footer ? `<div class="footer">${data.footer}</div>` : ""}
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  }
}

export function generateDailyReport(date: string, entries: any[], leads: any[]) {
  const todayEntries = entries.filter((e) => e.sent_at?.startsWith(date));
  const channels = ["whatsapp", "linkedin", "email", "call", "meeting"];

  generatePdfReport({
    title: "Tadbeer TT — Daily Outreach Report",
    subtitle: `Report for ${new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    stats: [
      { label: "Total Sent", value: todayEntries.length },
      { label: "Replies", value: todayEntries.filter((e) => ["replied", "interested"].includes(e.status)).length },
      { label: "Interested", value: todayEntries.filter((e) => e.status === "interested").length },
      { label: "No Response", value: todayEntries.filter((e) => e.status === "no_response").length },
      { label: "Reply Rate", value: todayEntries.length > 0 ? `${Math.round((todayEntries.filter((e) => ["replied", "interested"].includes(e.status)).length / todayEntries.length) * 100)}%` : "0%" },
      { label: "Leads Touched", value: new Set(todayEntries.map((e) => e.lead_id)).size },
    ],
    sections: [
      {
        title: "Outreach Activity",
        headers: ["Time", "Channel", "Contact", "Company", "Step", "Status", "Response"],
        rows: todayEntries.map((e) => [
          new Date(e.sent_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          e.channel,
          e.contact_name,
          e.company_name,
          `T${e.step_number}`,
          e.status,
          e.response_notes || "—",
        ]),
      },
      {
        title: "Channel Breakdown",
        headers: ["Channel", "Sent", "Replies", "Reply Rate"],
        rows: channels.map((ch) => {
          const chEntries = todayEntries.filter((e) => e.channel === ch);
          const chReplies = chEntries.filter((e) => ["replied", "interested"].includes(e.status));
          return [
            ch.charAt(0).toUpperCase() + ch.slice(1),
            chEntries.length,
            chReplies.length,
            chEntries.length > 0 ? `${Math.round((chReplies.length / chEntries.length) * 100)}%` : "—",
          ];
        }),
      },
      {
        title: "Pending Follow-ups",
        headers: ["Contact", "Company", "Channel", "Next Action", "Due Date"],
        rows: entries.filter((e) => e.follow_up_scheduled && e.status === "sent").sort((a, b) => a.next_action_date?.localeCompare(b.next_action_date)).slice(0, 10).map((e) => [
          e.contact_name,
          e.company_name,
          e.channel,
          e.next_action || "—",
          e.next_action_date || "—",
        ]),
      },
    ],
    footer: "Tadbeer TT — Confidential. Generated by Tadbeer CRM",
  });
}

export function generateLeadsReport(leads: any[], leadTypeMap: Record<string, string>, leadCategoryMap: Record<string, string[]>, categories: any[]) {
  const statusCounts: Record<string, number> = {};
  leads.forEach((l) => { statusCounts[l.lead_status] = (statusCounts[l.lead_status] || 0) + 1; });

  const typeCounts: Record<string, number> = {};
  leads.forEach((l) => { const t = leadTypeMap[l.id] || "Cold"; typeCounts[t] = (typeCounts[t] || 0) + 1; });

  generatePdfReport({
    title: "Tadbeer TT — Leads Report",
    subtitle: `${leads.length} total leads`,
    stats: [
      { label: "Total Leads", value: leads.length },
      { label: "Hot Leads", value: typeCounts["Hot"] || 0 },
      { label: "Meetings Booked", value: statusCounts["Meeting Booked"] || 0 },
      { label: "Proposals Sent", value: statusCounts["Proposal Sent"] || 0 },
      { label: "Won", value: statusCounts["Won"] || 0 },
      { label: "Pipeline Value", value: `OMR ${leads.reduce((s, l) => s + (l.est_deal_value || 0), 0).toLocaleString()}` },
    ],
    sections: [
      {
        title: "Leads by Status",
        headers: ["Status", "Count"],
        rows: Object.entries(statusCounts).map(([k, v]) => [k, v]),
      },
      {
        title: "Leads by Type",
        headers: ["Type", "Count"],
        rows: Object.entries(typeCounts).map(([k, v]) => [k, v]),
      },
      {
        title: "All Leads",
        headers: ["Contact", "Company", "Industry", "City", "Status", "Type", "Deal Value"],
        rows: leads.map((l) => [
          l.contact_name || l.company_name,
          l.company_name,
          l.industry || "—",
          l.city || "—",
          l.lead_status,
          leadTypeMap[l.id] || "Cold",
          `OMR ${(l.est_deal_value || 0).toLocaleString()}`,
        ]),
      },
    ],
    footer: "Tadbeer TT — Confidential. Generated by Tadbeer CRM",
  });
}
