import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const tokens = cookieStore.get('google_tokens');
  
  if (tokens) {
    return NextResponse.json({ connected: true });
  }

  // Check Firestore for central connection
  try {
    const settingsDoc = await adminDb.collection('settings').doc('google_sheets').get();
    if (settingsDoc.exists && settingsDoc.data()?.tokens) {
      return NextResponse.json({ connected: true, central: true });
    }
  } catch (error) {
    console.error('Error checking central Sheets connection:', error);
  }

  return NextResponse.json({ connected: false });
}
