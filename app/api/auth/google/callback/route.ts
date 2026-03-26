import { oauth2Client } from '@/lib/google';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const uid = searchParams.get('state');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in Firestore if uid is provided and is an admin
    if (uid) {
      try {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const isAdmin = userData?.role === 'admin' || userData?.email?.toLowerCase() === 'dhyonathan63@gmail.com';
        
        if (isAdmin) {
          await adminDb.collection('settings').doc('google_sheets').set({
            tokens,
            updatedAt: new Date().toISOString(),
            connectedBy: uid
          });
          console.log('Google Sheets tokens stored in Firestore for admin:', uid);
        }
      } catch (dbError) {
        console.error('Error storing tokens in Firestore:', dbError);
        // Continue even if Firestore fails, we still have the cookie for the current session
      }
    }

    // Store tokens in a secure cookie for the current session
    const cookieStore = await cookies();
    cookieStore.set('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    const html = `
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Autenticação bem-sucedida! Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({ error: 'Erro na autenticação' }, { status: 500 });
  }
}
