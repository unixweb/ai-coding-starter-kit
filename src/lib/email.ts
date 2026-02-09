/**
 * Brevo HTTP-API v3 wrapper + E-Mail template builder
 * Used by PROJ-9 (E-Mail-Versand) and prepared for PROJ-10 (Passwort in E-Mail)
 */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  replyTo?: { email: string; name?: string };
}

interface PortalEmailData {
  uploadUrl: string;
  label?: string;
  expiresAt?: string | null;
  password?: string; // PROJ-10: optional password field
}

export function buildPortalEmailHtml(data: PortalEmailData): string {
  const labelSection = data.label
    ? `<tr><td style="padding:0 0 20px 0;font-size:15px;line-height:1.5;color:#374151;">Betreff: <strong>${escapeHtml(data.label)}</strong></td></tr>`
    : "";

  const expiresSection =
    data.expiresAt
      ? `<tr><td style="padding:16px 0 0 0;font-size:13px;line-height:1.5;color:#6b7280;">Dieser Link ist gueltig bis ${formatDateDe(data.expiresAt)}.</td></tr>`
      : "";

  const passwordSection = data.password
    ? `<tr><td style="padding:16px 0 0 0;font-size:15px;line-height:1.5;color:#374151;">Ihr Passwort: <strong style="font-family:monospace;font-size:16px;letter-spacing:1px;background:#f3f4f6;padding:4px 10px;border-radius:4px;">${escapeHtml(data.password)}</strong></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">

<!-- Header -->
<tr><td style="padding:32px 40px 24px 40px;border-bottom:1px solid #e5e7eb;">
<h1 style="margin:0;font-size:20px;font-weight:700;color:#1e40af;">SafeDocs Portal</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:0 0 20px 0;font-size:15px;line-height:1.5;color:#374151;">Guten Tag,</td></tr>
<tr><td style="padding:0 0 20px 0;font-size:15px;line-height:1.5;color:#374151;">Sie haben einen sicheren Zugangslink zum Dokumenten-Upload erhalten.</td></tr>
${labelSection}
${passwordSection}
<tr><td style="padding:24px 0;" align="center">
<a href="${escapeHtml(data.uploadUrl)}" style="display:inline-block;padding:14px 32px;background-color:#1e40af;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">Dokumente hochladen</a>
</td></tr>
<tr><td style="padding:0 0 8px 0;font-size:13px;line-height:1.5;color:#6b7280;">Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:</td></tr>
<tr><td style="padding:0 0 0 0;font-size:13px;line-height:1.5;color:#1e40af;word-break:break-all;">${escapeHtml(data.uploadUrl)}</td></tr>
${expiresSection}
</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">Diese E-Mail wurde ueber SafeDocs Portal versendet. Bei Fragen wenden Sie sich an Ihren Ansprechpartner.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildPortalEmailText(data: PortalEmailData): string {
  let text = "Guten Tag,\n\n";
  text += "Sie haben einen sicheren Zugangslink zum Dokumenten-Upload erhalten.\n\n";

  if (data.label) {
    text += `Betreff: ${data.label}\n\n`;
  }

  if (data.password) {
    text += `Ihr Passwort: ${data.password}\n\n`;
  }

  text += `Dokumente hochladen: ${data.uploadUrl}\n`;

  if (data.expiresAt) {
    text += `\nDieser Link ist gueltig bis ${formatDateDe(data.expiresAt)}.\n`;
  }

  text += "\n---\nDiese E-Mail wurde ueber SafeDocs Portal versendet. Bei Fragen wenden Sie sich an Ihren Ansprechpartner.\n";

  return text;
}

export function buildPortalEmailSubject(label?: string): string {
  if (label && label.trim()) {
    return `Ihr Zugangslink: ${label.trim()}`;
  }
  return "Ihr Zugangslink zum Dokumenten-Upload";
}

export async function sendBrevoEmail(options: SendEmailOptions): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("E-Mail-Versand ist nicht konfiguriert");
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@safedocsportal.com";
  const senderName = process.env.BREVO_SENDER_NAME || "SafeDocs Portal";

  const body: Record<string, unknown> = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: options.to }],
    subject: options.subject,
    htmlContent: options.htmlContent,
    textContent: options.textContent,
  };

  if (options.replyTo) {
    body.replyTo = options.replyTo;
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = (errorData as Record<string, string>).message || `Brevo API Fehler (${res.status})`;
    throw new Error(message);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateDe(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================================
// PROJ-15: Outgoing Documents Email
// ============================================================

interface OutgoingFile {
  filename: string;
  file_size: number;
}

interface OutgoingEmailData {
  portalUrl: string;
  note: string;
  files: OutgoingFile[];
  expiresAt?: string | null;
  label?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function buildOutgoingEmailHtml(data: OutgoingEmailData): string {
  const labelSection = data.label
    ? `<tr><td style="padding:0 0 16px 0;font-size:15px;line-height:1.5;color:#374151;">Portal: <strong>${escapeHtml(data.label)}</strong></td></tr>`
    : "";

  const filesListHtml = data.files
    .map(
      (f) =>
        `<li style="padding:4px 0;font-size:14px;color:#374151;">${escapeHtml(f.filename)} <span style="color:#6b7280;">(${formatFileSize(f.file_size)})</span></li>`
    )
    .join("");

  const expiresSection = data.expiresAt
    ? `<tr><td style="padding:16px 0 0 0;font-size:13px;line-height:1.5;color:#dc2626;"><strong>Hinweis:</strong> Diese Dokumente sind verfuegbar bis ${formatDateDe(data.expiresAt)}.</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">

<!-- Header -->
<tr><td style="padding:32px 40px 24px 40px;border-bottom:1px solid #e5e7eb;">
<h1 style="margin:0;font-size:20px;font-weight:700;color:#1e40af;">SafeDocs Portal</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:0 0 20px 0;font-size:15px;line-height:1.5;color:#374151;">Guten Tag,</td></tr>
<tr><td style="padding:0 0 20px 0;font-size:15px;line-height:1.5;color:#374151;">es wurden neue Dokumente fuer Sie bereitgestellt.</td></tr>
${labelSection}
<tr><td style="padding:0 0 16px 0;font-size:15px;line-height:1.6;color:#374151;background:#f3f4f6;border-radius:6px;padding:16px;">
${escapeHtml(data.note).replace(/\n/g, "<br>")}
</td></tr>

<tr><td style="padding:20px 0 8px 0;font-size:14px;font-weight:600;color:#374151;">Bereitgestellte Dokumente:</td></tr>
<tr><td style="padding:0 0 20px 0;">
<ul style="margin:0;padding-left:20px;">
${filesListHtml}
</ul>
</td></tr>

<tr><td style="padding:24px 0;" align="center">
<a href="${escapeHtml(data.portalUrl)}" style="display:inline-block;padding:14px 32px;background-color:#1e40af;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">Dokumente herunterladen</a>
</td></tr>
<tr><td style="padding:0 0 8px 0;font-size:13px;line-height:1.5;color:#6b7280;">Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:</td></tr>
<tr><td style="padding:0 0 0 0;font-size:13px;line-height:1.5;color:#1e40af;word-break:break-all;">${escapeHtml(data.portalUrl)}</td></tr>
${expiresSection}
</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">Diese E-Mail wurde ueber SafeDocs Portal versendet. Bei Fragen wenden Sie sich an Ihren Ansprechpartner.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildOutgoingEmailText(data: OutgoingEmailData): string {
  let text = "Guten Tag,\n\n";
  text += "es wurden neue Dokumente fuer Sie bereitgestellt.\n\n";

  if (data.label) {
    text += `Portal: ${data.label}\n\n`;
  }

  text += `Nachricht:\n${data.note}\n\n`;

  text += "Bereitgestellte Dokumente:\n";
  for (const f of data.files) {
    text += `- ${f.filename} (${formatFileSize(f.file_size)})\n`;
  }

  text += `\nDokumente herunterladen: ${data.portalUrl}\n`;

  if (data.expiresAt) {
    text += `\nHinweis: Diese Dokumente sind verfuegbar bis ${formatDateDe(data.expiresAt)}.\n`;
  }

  text +=
    "\n---\nDiese E-Mail wurde ueber SafeDocs Portal versendet. Bei Fragen wenden Sie sich an Ihren Ansprechpartner.\n";

  return text;
}

export function buildOutgoingEmailSubject(): string {
  return "Neue Dokumente fuer Sie bereitgestellt";
}

// ============================================================
// PROJ-18: Team Invitation Email
// ============================================================

interface TeamInviteEmailData {
  inviteUrl: string;
  ownerName: string;
  firstName?: string;
}

export function buildTeamInviteEmailHtml(data: TeamInviteEmailData): string {
  const greeting = data.firstName
    ? `Hallo ${escapeHtml(data.firstName)}!`
    : "Hallo!";

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">

<!-- Header -->
<tr><td style="padding:32px 40px 24px 40px;border-bottom:1px solid #e5e7eb;">
<h1 style="margin:0;font-size:20px;font-weight:700;color:#1e40af;">SafeDocs Portal</h1>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="padding:0 0 20px 0;font-size:15px;line-height:1.5;color:#374151;">${greeting}</td></tr>
<tr><td style="padding:0 0 20px 0;font-size:15px;line-height:1.5;color:#374151;"><strong>${escapeHtml(data.ownerName)}</strong> hat Sie zu SafeDocs Portal eingeladen.</td></tr>
<tr><td style="padding:0 0 20px 0;font-size:15px;line-height:1.5;color:#374151;">SafeDocs Portal ist eine sichere Plattform fuer den Dokumentenaustausch. Klicken Sie auf den folgenden Link, um Ihren Account zu aktivieren:</td></tr>
<tr><td style="padding:24px 0;" align="center">
<a href="${escapeHtml(data.inviteUrl)}" style="display:inline-block;padding:14px 32px;background-color:#1e40af;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;border-radius:6px;">Account aktivieren</a>
</td></tr>
<tr><td style="padding:0 0 8px 0;font-size:13px;line-height:1.5;color:#6b7280;">Falls der Button nicht funktioniert, kopieren Sie diesen Link in Ihren Browser:</td></tr>
<tr><td style="padding:0 0 0 0;font-size:13px;line-height:1.5;color:#1e40af;word-break:break-all;">${escapeHtml(data.inviteUrl)}</td></tr>
<tr><td style="padding:16px 0 0 0;font-size:13px;line-height:1.5;color:#6b7280;">Dieser Link ist 7 Tage gueltig.</td></tr>
<tr><td style="padding:16px 0 0 0;font-size:13px;line-height:1.5;color:#6b7280;">Falls Sie diese Einladung nicht erwartet haben, koennen Sie diese E-Mail ignorieren.</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 40px;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">Diese E-Mail wurde ueber SafeDocs Portal versendet.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildTeamInviteEmailText(data: TeamInviteEmailData): string {
  const greeting = data.firstName ? `Hallo ${data.firstName}!` : "Hallo!";

  let text = `${greeting}\n\n`;
  text += `${data.ownerName} hat Sie zu SafeDocs Portal eingeladen.\n\n`;
  text += "SafeDocs Portal ist eine sichere Plattform fuer den Dokumentenaustausch.\n";
  text += "Klicken Sie auf den folgenden Link, um Ihren Account zu aktivieren:\n\n";
  text += `${data.inviteUrl}\n\n`;
  text += "Dieser Link ist 7 Tage gueltig.\n\n";
  text += "Falls Sie diese Einladung nicht erwartet haben, koennen Sie diese E-Mail ignorieren.\n";
  text += "\n---\nDiese E-Mail wurde ueber SafeDocs Portal versendet.\n";

  return text;
}

export function buildTeamInviteEmailSubject(): string {
  return "Einladung zu SafeDocs Portal";
}

export async function sendTeamInviteEmail(options: {
  to: string;
  inviteUrl: string;
  ownerName: string;
  firstName?: string;
}): Promise<void> {
  const data: TeamInviteEmailData = {
    inviteUrl: options.inviteUrl,
    ownerName: options.ownerName,
    firstName: options.firstName,
  };

  await sendBrevoEmail({
    to: options.to,
    subject: buildTeamInviteEmailSubject(),
    htmlContent: buildTeamInviteEmailHtml(data),
    textContent: buildTeamInviteEmailText(data),
  });
}
