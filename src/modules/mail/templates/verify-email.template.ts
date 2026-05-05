/**
 * HTML-шаблон листа з кодом підтвердження.
 * Стилі inline — щоб коректно рендерилось у Gmail/Outlook/Apple Mail.
 */
export function verifyEmailHtml(opts: { code: string; appName: string; expiresInMinutes: number }): string {
    const { code, appName, expiresInMinutes } = opts;

    return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${appName} — код підтвердження</title>
</head>
<body style="margin:0;padding:0;background:#f5f5fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f5fa;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#ffffff;border-radius:18px;box-shadow:0 4px 24px rgba(0,0,0,0.05);overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 8px;text-align:center;">
              <div style="display:inline-block;background:#1e1b2e;color:#ffffff;font-weight:700;font-size:18px;letter-spacing:0.04em;padding:8px 16px;border-radius:10px;">
                ${appName}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 8px;">
              <h1 style="margin:0 0 12px;font-size:24px;color:#1e1b2e;font-weight:700;">Код підтвердження</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a55;">
                Привіт! Щоб завершити реєстрацію, введіть цей код у вкладці підтвердження пошти:
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 8px;text-align:center;">
              <div style="display:inline-block;background:#f0eefb;color:#1e1b2e;font-size:36px;font-weight:700;letter-spacing:0.4em;padding:18px 28px;border-radius:14px;border:1.5px solid rgba(172,158,248,0.5);font-family:'Courier New',monospace;">
                ${code}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 28px;">
              <p style="margin:0 0 8px;font-size:14px;color:#6b7280;line-height:1.6;">
                Код дійсний <strong>${expiresInMinutes} хвилин</strong>. Якщо ви не запитували код — просто проігноруйте цей лист.
              </p>
              <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">
                З повагою,<br />Команда ${appName}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;font-size:12px;color:#9ca3af;">
          Цей лист згенеровано автоматично, не відповідайте на нього.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function verifyEmailText(opts: { code: string; appName: string; expiresInMinutes: number }): string {
    return `${opts.appName} — код підтвердження пошти

Код: ${opts.code}
Дійсний ${opts.expiresInMinutes} хвилин.

Якщо ви не запитували код — проігноруйте цей лист.`;
}
