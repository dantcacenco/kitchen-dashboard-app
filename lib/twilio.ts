import twilio from 'twilio';

let client: ReturnType<typeof twilio> | null = null;

export function getTwilioClient() {
  if (!client) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    client = twilio(accountSid, authToken);
  }
  return client;
}

export async function sendSMS(to: string, message: string) {
  const client = getTwilioClient();
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error('No Twilio phone number configured');
  }

  try {
    const result = await client.messages.create({
      body: message,
      from,
      to,
    });
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}
