/**
 * Terrnix Assessment Participant Email Service
 *
 * Sends confirmation emails to assessment participants via Brevo.
 * Includes score, maturity level, and links to report/certificate.
 *
 * @author Terrnix Security Team
 * @version 1.0.0
 */

import { sendBrevoEmailWithTimeout } from './brevoEmail.js';

const DEFAULT_FROM = process.env.CONTACT_FROM_EMAIL || process.env.ZOHO_SMTP_USER || 'notifications@terrnix.com';

/**
 * Send assessment results email to participant.
 * @param {Object} opts
 * @param {string} opts.to — participant email
 * @param {string} opts.participantName
 * @param {string} opts.assessmentName
 * @param {number} opts.score
 * @param {string} opts.maturityLevel
 * @param {string} opts.certificateId
 * @param {string} opts.verificationUrl
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export async function sendAssessmentResultsEmail({
  to,
  participantName,
  assessmentName,
  score,
  maturityLevel,
  certificateId,
  verificationUrl
}) {
  if (!to || !participantName) {
    return { success: false, error: 'Missing required fields: to, participantName' };
  }

  const subject = `Your Terrnix ${assessmentName || 'Carbon Accounting Readiness'} Assessment Results`;

  const textBody = `Dear ${participantName},

Thank you for completing the Terrnix ${assessmentName || 'Carbon Accounting Readiness Assessment'}.

YOUR RESULTS
============
Score: ${score}/100
Maturity Level: ${maturityLevel}

CERTIFICATE
===========
Your certificate ID: ${certificateId}
Verify your certificate: ${verificationUrl}

NEXT STEPS
==========
- Download your full assessment report from the results page
- Book a free consultation with our carbon accounting specialists
- Explore our recommended resources for your maturity level

ABOUT TERRNIX
=============
Terrnix helps organisations measure, manage, and report their environmental impact with precision and confidence.

This assessment provides a diagnostic view of your carbon accounting readiness based on your responses. It is not a professional audit, regulatory certification, or substitute for independent assurance.

---
Terrnix
https://terrnix.com
`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Terrnix Assessment Results</title>
</head>
<body style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #059669 0%, #0f766e 100%); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Your Assessment Results</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Terrnix ${assessmentName || 'Carbon Accounting Readiness Assessment'}</p>
  </div>

  <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px;">Dear <strong>${participantName}</strong>,</p>

    <p>Thank you for completing the Terrnix assessment. Here are your results:</p>

    <div style="background: white; padding: 24px; border-radius: 8px; margin: 24px 0; text-align: center; border: 1px solid #e2e8f0;">
      <div style="font-size: 48px; font-weight: 700; color: #059669;">${score}<span style="font-size: 24px; color: #64748b;">/100</span></div>
      <div style="font-size: 18px; font-weight: 600; color: #0f766e; margin-top: 8px;">${maturityLevel}</div>
    </div>

    <h2 style="color: #0f766e; font-size: 18px; margin-top: 32px;">Your Certificate</h2>
    <p>Certificate ID: <code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${certificateId}</code></p>
    <p><a href="${verificationUrl}" style="color: #059669; text-decoration: none; font-weight: 600;">Verify your certificate →</a></p>

    <h2 style="color: #0f766e; font-size: 18px; margin-top: 32px;">Next Steps</h2>
    <ul style="padding-left: 20px;">
      <li>Download your full assessment report from the results page</li>
      <li>Book a free consultation with our specialists</li>
      <li>Explore recommended resources for your maturity level</li>
    </ul>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">
      <p>This assessment provides a diagnostic view of your carbon accounting readiness based on your responses. It is not a professional audit, regulatory certification, or substitute for independent assurance.</p>
      <p style="margin-top: 16px;"><strong>Terrnix</strong><br><a href="https://terrnix.com" style="color: #059669;">terrnix.com</a></p>
    </div>
  </div>
</body>
</html>`;

  return sendBrevoEmailWithTimeout({
    to,
    subject,
    text: textBody,
    html: htmlBody
  }, 10000);
}
