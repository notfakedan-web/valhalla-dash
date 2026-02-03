import { google } from 'googleapis';
import { NextResponse } from 'next/server';

interface LeadFlowData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  submitted_at: string;
  goal: string;
  monthly_rev: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  familiarity: string;
  desired_income: string;
  biggest_issue: string;
  investment_amount: string;
  credit_score: string;
}

export async function GET() {
  try {
    // ============================================================================
    // GOOGLE SHEETS AUTHENTICATION
    // ============================================================================
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // ============================================================================
    // FETCH DATA FROM LEAD FLOW SHEET
    // ============================================================================
    
    const spreadsheetId = process.env.LEAD_FLOW_SHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('LEAD_FLOW_SHEET_ID environment variable is not set');
    }

    // Adjust range based on your actual sheet structure
    // This fetches columns A through Q (17 columns total)
    const range = 'Sheet1!A2:Q';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      return NextResponse.json([]);
    }

    // ============================================================================
    // TRANSFORM DATA
    // ============================================================================
    
    const data: LeadFlowData[] = rows.map((row) => ({
      utm_source: row[0] || '',
      utm_medium: row[1] || '',
      utm_campaign: row[2] || '',
      utm_content: row[3] || '',
      utm_term: row[4] || '',
      submitted_at: row[5] || '',
      goal: row[6] || '',
      monthly_rev: row[7] || '',
      first_name: row[8] || '',
      last_name: row[9] || '',
      phone: row[10] || '',
      email: row[11] || '',
      familiarity: row[12] || '',
      desired_income: row[13] || '',
      biggest_issue: row[14] || '',
      investment_amount: row[15] || '',
      credit_score: row[16] || '',
    }));

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching lead flow data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead flow data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
