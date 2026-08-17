export function exportToCsv(data: Record<string, any>[], filename: string, columns?: { key: string; label: string }[]) {
  if (!data.length) return;

  const cols = columns || Object.keys(data[0]).map((k) => ({ key: k, label: k }));
  const headers = cols.map((c) => c.label);
  const rows = data.map((row) =>
    cols.map((c) => {
      const val = row[c.key] ?? "";
      // Replace internal newlines with " | " so multiline notes never break CSV spreadsheet row alignment
      let str = String(val).replace(/\r\n/g, " | ").replace(/\n/g, " | ").trim();
      if (str.includes(",") || str.includes('"') || str.includes(";")) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    })
  );

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
