// ─────────────────────────────────────────────────────────────
// Dependency-free PDF résumé generator.
//
// Builds a clean single-column résumé from the portfolio data and
// streams it to the browser as a real application/pdf download — no
// external library. It emits PDF 1.4 with the two standard Helvetica
// fonts, so it stays tiny and works fully offline.
//
// Everything is kept in Latin-1 (1 char === 1 byte) so string indices
// equal byte offsets, which the xref table depends on.
// ─────────────────────────────────────────────────────────────

const PAGE_W = 612; // US Letter, points
const PAGE_H = 792;
const M = 56; // margin
const CONTENT_W = PAGE_W - M * 2;

const INK = [0.11, 0.13, 0.16];
const GRAY = [0.42, 0.45, 0.5];
const ACCENT = [0.16, 0.42, 0.68];
const RULE = [0.78, 0.8, 0.84];

// Escape the three chars that are special inside a PDF string literal.
function esc(s) {
  return s.replace(/[\\()]/g, (m) => "\\" + m);
}

// Map common typographic punctuation to Latin-1 so it survives sanitize()
// instead of vanishing (e.g. "2023 — Present" losing its dash).
const TRANSLIT = {
  "—": "-", "–": "-", "‒": "-", // dashes
  "•": "·", "▪": "·",        // bullets -> middle dot
  "→": "->", "⇒": "=>",                // arrows
  "‘": "'", "’": "'", "“": '"', "”": '"',
  "…": "...", " ": " ", " ": " ", "– ": "- ",
};

// Drop anything the standard fonts can't encode (emoji, CJK, …).
function sanitize(s) {
  let out = "";
  for (const ch of String(s)) {
    const mapped = TRANSLIT[ch] ?? ch;
    for (const m of mapped) {
      const c = m.codePointAt(0);
      if (c >= 0x20 && c <= 0xff) out += m;
    }
  }
  return out.replace(/\s+$/g, "");
}

// Greedy word-wrap to an approximate character budget for the font size.
function wrap(text, size) {
  const maxChars = Math.max(8, Math.floor(CONTENT_W / (size * 0.5)));
  const words = sanitize(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Turn the portfolio into an ordered list of layout blocks.
function blocks(p) {
  const b = [];
  const pr = p.profile || {};
  const c = p.contact || {};

  b.push({ text: pr.name || pr.user || "Résumé", size: 21, bold: true, gap: 0 });
  const sub = [pr.title, pr.location].filter(Boolean).join("   •   ");
  if (sub) b.push({ text: sub, size: 10.5, color: GRAY, gap: 3 });

  const contact = [c.email, c.website, c.github, c.linkedin].filter(Boolean).join("   ·   ");
  if (contact) b.push({ text: contact, size: 9.5, color: ACCENT, gap: 3 });
  b.push({ rule: true, gap: 10 });

  const section = (title) => b.push({ text: title.toUpperCase(), size: 11, bold: true, color: ACCENT, gap: 14 });

  if (pr.bio?.length) {
    section("Summary");
    b.push({ text: pr.bio.filter(Boolean).join(" "), size: 10, gap: 6 });
  }

  if (p.companies?.length) {
    section("Experience");
    p.companies.forEach((co, i) => {
      b.push({ text: `${co.role} — ${co.company}`, size: 11, bold: true, gap: i === 0 ? 6 : 10 });
      b.push({ text: [co.period, co.location].filter(Boolean).join("  ·  "), size: 9.5, color: GRAY, gap: 1 });
      if (co.description) b.push({ text: co.description, size: 10, gap: 3 });
    });
  }

  if (p.projects?.length) {
    section("Projects");
    p.projects.forEach((pj, i) => {
      b.push({ text: `${pj.name}${pj.year ? `  (${pj.year})` : ""}`, size: 11, bold: true, gap: i === 0 ? 6 : 10 });
      if (pj.description) b.push({ text: pj.description, size: 10, gap: 3 });
      if (pj.tech?.length) b.push({ text: pj.tech.join("  ·  "), size: 9, color: GRAY, gap: 1 });
    });
  }

  if (p.skills && Object.keys(p.skills).length) {
    section("Skills");
    Object.entries(p.skills).forEach(([group, items], i) => {
      const names = (items || []).map((s) => s.name).join(", ");
      b.push({ text: `${group}:  ${names}`, size: 10, gap: i === 0 ? 6 : 3 });
    });
  }

  return b;
}

// Flow the blocks into pages of positioned draw items.
function layout(b) {
  const pages = [];
  let page = [];
  let y = PAGE_H - M;
  const feed = () => { pages.push(page); page = []; y = PAGE_H - M; };

  for (const blk of b) {
    y -= blk.gap || 0;
    const size = blk.size || 10;
    const leading = size * 1.4;
    if (blk.rule) {
      if (y < M + leading) feed();
      page.push({ rule: true, y: y - 2 });
      y -= 6;
      continue;
    }
    const lines = wrap(blk.text, size);
    for (const ln of lines) {
      if (y < M) feed();
      page.push({ x: M, y, size, bold: blk.bold, color: blk.color || INK, text: sanitize(ln) });
      y -= leading;
    }
  }
  if (page.length) pages.push(page);
  return pages;
}

const n2 = (n) => Number(n).toFixed(2);

function contentStream(items) {
  let s = "";
  for (const it of items) {
    if (it.rule) {
      s += `${n2(RULE[0])} ${n2(RULE[1])} ${n2(RULE[2])} RG 0.8 w ${M} ${n2(it.y)} m ${PAGE_W - M} ${n2(it.y)} l S\n`;
    } else {
      const f = it.bold ? "/F2" : "/F1";
      const c = it.color;
      s += `BT ${f} ${n2(it.size)} Tf ${n2(c[0])} ${n2(c[1])} ${n2(c[2])} rg ${n2(it.x)} ${n2(it.y)} Td (${esc(it.text)}) Tj ET\n`;
    }
  }
  return s;
}

function buildPDF(p) {
  const pages = layout(blocks(p));

  // Fixed object numbering: 1 catalog, 2 pages, 3 F1, 4 F2,
  // then (content, page) pairs starting at 5.
  const bodies = {};
  const pageNums = [];
  pages.forEach((items, i) => {
    const contentNum = 5 + i * 2;
    const pageNum = 6 + i * 2;
    pageNums.push(pageNum);
    const stream = contentStream(items);
    bodies[contentNum] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
    bodies[pageNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentNum} 0 R >>`;
  });

  bodies[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  bodies[2] = `<< /Type /Pages /Kids [${pageNums.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageNums.length} >>`;
  bodies[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  bodies[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  const maxNum = 4 + pages.length * 2;
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  for (let num = 1; num <= maxNum; num++) {
    offsets[num] = pdf.length;
    pdf += `${num} 0 obj\n${bodies[num]}\nendobj\n`;
  }

  const xrefOff = pdf.length;
  const count = maxNum + 1;
  pdf += `xref\n0 ${count}\n0000000000 65535 f \n`;
  for (let num = 1; num <= maxNum; num++) {
    pdf += String(offsets[num]).padStart(10, "0") + " 00000 n \n";
  }
  pdf += `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${xrefOff}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff;
  return bytes;
}

// Generate the résumé and trigger a browser download.
// Returns the filename used.
export function downloadResume(portfolio) {
  const name = (portfolio.profile?.name || portfolio.profile?.user || "resume")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Prefer a résumé uploaded via the admin panel (stored as a data URL).
  const uploaded = portfolio.resume;
  if (uploaded && uploaded.dataUrl) {
    const filename = uploaded.name || `${name || "resume"}-resume.pdf`;
    const a = document.createElement("a");
    a.href = uploaded.dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return filename;
  }

  // Otherwise generate a PDF from the portfolio data.
  const bytes = buildPDF(portfolio);
  const filename = `${name || "resume"}-resume.pdf`;

  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  return filename;
}
