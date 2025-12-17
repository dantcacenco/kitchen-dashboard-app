import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/twilio';

const PHONE_NUMBERS = ['+18282158311', '+18287675595'];
const MESSAGE = 'Shopping List Updated! View on: https://kitchen-dashboard-app.vercel.app';

export async function POST() {
  try {
    // Send SMS to both phone numbers
    const results = await Promise.all(
      PHONE_NUMBERS.map((phone) => sendSMS(phone, MESSAGE))
    );

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${PHONE_NUMBERS.length} recipients`,
      results: results.map((r) => ({ sid: r.sid, status: r.status })),
    });
  } catch (error) {
    console.error('Failed to send notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notifications',
      },
      { status: 500 }
    );
  }
}
