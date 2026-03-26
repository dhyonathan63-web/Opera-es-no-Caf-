import { oauth2Client, SCOPES } from '@/lib/google';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
      state: uid || undefined
    });
    
    // Log for debugging (visible in server logs)
    console.log('Generated Google Auth URL:', url);
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error generating Google Auth URL:', error);
    return NextResponse.json({ error: 'Erro ao gerar URL de autenticação' }, { status: 500 });
  }
}
