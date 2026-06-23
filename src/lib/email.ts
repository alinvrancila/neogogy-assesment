/**
 * Transactional email via Amazon SES v2.
 *
 * Sending is gated on EMAIL_ENABLED === 'true' AND EMAIL_FROM being set. Until
 * the lci-dev IAM user is granted ses:SendEmail and the sending domain is
 * verified (and the account is out of the SES sandbox), leave EMAIL_ENABLED
 * unset: sendReportEmail() becomes a logged no-op and the user still gets
 * on-screen results plus the PDF download. No code change is needed to switch
 * email on later, only the environment variables.
 */

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-southeast-1';

export const isEmailEnabled = () =>
  process.env.EMAIL_ENABLED === 'true' && Boolean(process.env.EMAIL_FROM);

export const sendReportEmail = async ({
  to,
  name,
  personaName,
  bodyText,
  pdf
}: {
  to: string;
  name: string;
  personaName: string;
  bodyText: string;
  pdf: Buffer;
}): Promise<{ sent: boolean; reason?: string }> => {
  if (!isEmailEnabled()) {
    return { sent: false, reason: 'email_disabled' };
  }

  // Build a MIME message with the PDF attachment using nodemailer's composer,
  // then hand the raw bytes to SES v2 SendEmail (Raw content).
  const MailComposer = (await import('nodemailer/lib/mail-composer')).default;
  const mail = new MailComposer({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your Neogogy Formation Compass: ${personaName}`,
    text: bodyText,
    attachments: [
      {
        filename: 'Neogogy_Formation_Compass.pdf',
        content: pdf,
        contentType: 'application/pdf'
      }
    ]
  });

  const raw: Buffer = await new Promise((resolve, reject) => {
    mail.compile().build((err: Error | null, message: Buffer) => {
      if (err) reject(err);
      else resolve(message);
    });
  });

  const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2');
  const client = new SESv2Client({ region: REGION });
  await client.send(
    new SendEmailCommand({
      FromEmailAddress: process.env.EMAIL_FROM,
      Destination: { ToAddresses: [to] },
      Content: { Raw: { Data: raw } }
    })
  );
  return { sent: true };
};
