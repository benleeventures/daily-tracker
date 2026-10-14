type Row = Record<string, unknown>;

const RECLAIM = ['Delegate', 'Automate', 'Drop'];
const AUDIT_URL = 'https://teambenlee.com/energy-audit';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clip = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

function rowsOf(v: unknown): Row[] {
  return (Array.isArray(v) ? v : []).filter((r): r is Row => typeof r === 'object' && r !== null).slice(0, 50);
}

export function buildReportEmail(name: string, answers: Record<string, unknown>) {
  const scored = rowsOf(answers.tasks)
    .map((r) => ({
      task: clip(r.task),
      hours: typeof r.hours === 'number' && isFinite(r.hours) ? r.hours : 0,
      energy: typeof r.energy === 'number' && isFinite(r.energy) ? Math.max(-3, Math.min(3, r.energy)) : null,
      action: clip(r.action, 40),
      www: clip(r.www),
    }))
    .filter((r) => r.task && r.hours > 0 && r.energy !== null) as {
    task: string;
    hours: number;
    energy: number;
    action: string;
    www: string;
  }[];

  const total = scored.reduce((a, r) => a + r.hours, 0);
  const drain = scored.filter((r) => r.energy < 0).reduce((a, r) => a + r.hours, 0);
  const reclaim = scored.filter((r) => r.energy < 0 && RECLAIM.includes(r.action)).reduce((a, r) => a + r.hours, 0);
  const worst = scored.filter((r) => r.energy < 0).sort((a, b) => a.hours * a.energy - b.hours * b.energy).slice(0, 3);
  const byImpact = [...scored].sort((a, b) => a.hours * a.energy - b.hours * b.energy);

  const tolerating = rowsOf(answers.tolerating)
    .map((r) => ({ what: clip(r.what), action: clip(r.action, 40), www: clip(r.www) }))
    .filter((r) => r.what);
  const start = rowsOf(answers.start)
    .map((r) => ({ what: clip(r.what), www: clip(r.www) }))
    .filter((r) => r.what);

  const first = clip(name, 60).split(' ')[0];
  const hello = first ? `Hi ${first},` : 'Hi,';
  const impactStr = (r: { hours: number; energy: number }) => {
    const i = r.hours * r.energy;
    return `${i > 0 ? '+' : ''}${fmt(i)}`;
  };

  const text: string[] = [hello, '', 'Here are your Energy Audit results.', ''];
  if (scored.length) {
    text.push(`${fmt(total)} hours a week mapped`, `${fmt(drain)} hours draining you`, `${fmt(reclaim)} hours you're taking back`, '');
    if (worst.length) {
      text.push('Biggest drains:');
      worst.forEach((r) => text.push(`- ${r.task}: ${r.action || 'No decision yet'}`));
      text.push('');
    }
    text.push('Everything, by impact (hours x rating):');
    byImpact.forEach((r) => text.push(`- ${r.task}: ${impactStr(r)}`));
    text.push('');
  }
  if (tolerating.length) {
    text.push("What you're tolerating:");
    tolerating.forEach((r) => text.push(`- ${r.what}${r.action ? ` (${r.action})` : ''}${r.www ? `: ${r.www}` : ''}`));
    text.push('');
  }
  if (start.length) {
    text.push("What you'll start:");
    start.forEach((r) => text.push(`- ${r.what}${r.www ? `: ${r.www}` : ''}`));
    text.push('');
  }
  text.push('Run this again in 90 days. The list will be different, and that is the point.', '', `Open it again: ${AUDIT_URL}`, '', 'Ben');

  const ink = '#3d3a33';
  const muted = '#676d55';
  const alert = '#a0523a';
  const green = '#5a7340';
  const line = '#e8e3db';
  const h2 = (s: string) =>
    `<p style="margin:28px 0 8px;font-size:11px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:${muted}">${s}</p>`;
  const li = (s: string) => `<li style="margin:0 0 6px">${s}</li>`;
  const stat = (n: string, label: string, color = ink) =>
    `<td style="padding:0 20px 0 0;vertical-align:top"><div style="font-size:26px;font-weight:600;color:${color}">${n}</div><div style="font-size:12px;color:${muted}">${label}</div></td>`;

  const html = `<!doctype html><html><body style="margin:0;background:#faf8f3;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${ink}">
<div style="max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid ${line};border-radius:6px;padding:28px 24px;font-size:15px;line-height:1.6">
<p style="margin:0 0 4px">${esc(hello)}</p>
<p style="margin:0 0 8px">Here are your Energy Audit results.</p>
${
  scored.length
    ? `<table role="presentation" style="margin:16px 0 0;border-collapse:collapse"><tr>${stat(fmt(total), 'hours a week mapped')}${stat(fmt(drain), 'hours draining you', drain > 0 ? alert : ink)}${stat(fmt(reclaim), "hours you're taking back", reclaim > 0 ? green : ink)}</tr></table>
${
  worst.length
    ? h2('Biggest drains') +
      `<ul style="margin:0;padding-left:20px">${worst.map((r) => li(`${esc(r.task)} <span style="color:${r.action ? ink : alert}">(${esc(r.action || 'No decision yet')})</span>`)).join('')}</ul>`
    : ''
}
${h2('Everything, by impact')}
<p style="margin:0 0 8px;font-size:12px;color:${muted}">Hours a week x energy rating. More negative drains more.</p>
<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px">${byImpact
        .map(
          (r) =>
            `<tr><td style="padding:6px 0;border-bottom:1px solid ${line}">${esc(r.task)}</td><td style="padding:6px 0;border-bottom:1px solid ${line};text-align:right;white-space:nowrap;color:${r.energy < 0 ? alert : r.energy > 0 ? green : muted}">${esc(impactStr(r))}</td></tr>`
        )
        .join('')}</table>`
    : `<p style="color:${muted}">No hours and ratings came through, so there is nothing to total yet. Open the audit to finish it.</p>`
}
${
  tolerating.length
    ? h2("What you're tolerating") +
      `<ul style="margin:0;padding-left:20px">${tolerating.map((r) => li(`${esc(r.what)}${r.action ? ` <span style="color:${muted}">(${esc(r.action)})</span>` : ''}${r.www ? `<br><span style="color:${muted}">${esc(r.www)}</span>` : ''}`)).join('')}</ul>`
    : ''
}
${
  start.length
    ? h2("What you'll start") +
      `<ul style="margin:0;padding-left:20px">${start.map((r) => li(`${esc(r.what)}${r.www ? `<br><span style="color:${muted}">${esc(r.www)}</span>` : ''}`)).join('')}</ul>`
    : ''
}
<p style="margin:28px 0 0">Run this again in 90 days. The list will be different, and that's the point.</p>
<p style="margin:16px 0 0"><a href="${AUDIT_URL}" style="color:#876a30">Open the audit again</a></p>
<p style="margin:16px 0 0">Ben</p>
</div></body></html>`;

  return { subject: 'Your Energy Audit results', html, text: text.join('\n') };
}
