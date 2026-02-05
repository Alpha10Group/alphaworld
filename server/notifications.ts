// Notification service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export interface NotificationPayload {
  type: 'memo_created' | 'memo_approved' | 'memo_rejected' | 'issue_created' | 'ticket_created' | 'ticket_updated';
  title: string;
  message: string;
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  memoId?: string;
  entity?: string;
}

export async function sendEmailNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const emailContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #961A1C; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; background-color: #f9f9f9; }
    .message { background-color: white; padding: 20px; border-radius: 8px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; background-color: #961A1C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Alpha10 World</h1>
    </div>
    <div class="content">
      <h2>${payload.title}</h2>
      <div class="message">
        <p>Hello ${payload.recipientName},</p>
        <p>${payload.message}</p>
        ${payload.memoId ? `<p><strong>Reference:</strong> ${payload.memoId}</p>` : ''}
        ${payload.entity ? `<p><strong>Entity:</strong> ${payload.entity}</p>` : ''}
      </div>
      <a href="#" class="button">View in Alpha10 World</a>
    </div>
    <div class="footer">
      <p>This is an automated notification from Alpha10 World workflow system.</p>
      <p>&copy; ${new Date().getFullYear()} Alpha10 Group. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const result = await client.emails.send({
      from: fromEmail || 'Alpha10 World <notifications@alpha10.com>',
      to: payload.recipientEmail,
      subject: `[Alpha10 World] ${payload.title}`,
      html: emailContent,
    });

    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}

export async function sendSMSNotification(phone: string, message: string): Promise<boolean> {
  // SMS integration will be added when Twilio is set up
  console.log('SMS notification (placeholder):', phone, message);
  return false;
}
