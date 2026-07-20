import { google } from 'googleapis';
import { oauth2Client } from '@/lib/google';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  let tokensStr = cookieStore.get('google_tokens')?.value;
  let tokens: any = null;

  if (tokensStr) {
    tokens = JSON.parse(tokensStr);
  } else {
    // Try to get tokens from Firestore (central connection)
    try {
      const settingsDoc = await adminDb.collection('settings').doc('google_sheets').get();
      if (settingsDoc.exists && settingsDoc.data()?.tokens) {
        tokens = settingsDoc.data()?.tokens;
        console.log('Using central Google Sheets connection from Firestore');
      }
    } catch (dbError) {
      console.error('Error reading central tokens from Firestore:', dbError);
    }
  }

  if (!tokens) {
    return NextResponse.json({ error: 'Não conectado ao Google Sheets. Peça ao administrador para conectar.' }, { status: 401 });
  }

  oauth2Client.setCredentials(tokens);

  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || process.env.GOOGLE_SPREADSI;

  if (!spreadsheetId) {
    return NextResponse.json({ error: 'ID da planilha não configurado nos Secrets' }, { status: 400 });
  }

  const maskedId = spreadsheetId.length > 10
    ? `${spreadsheetId.substring(0, 5)}...${spreadsheetId.substring(spreadsheetId.length - 5)}`
    : 'ID muito curto';
  console.log(`Attempting to append to spreadsheet. ID: ${maskedId}, Length: ${spreadsheetId.length}`);

  const body = await request.json();
  const {
    date,
    tractor,
    implement,
    task,
    crop,
    sector,
    initialMeter,
    finalMeter,
    operatorName,
    entryId,
    distanceGps,
    areaEstimated,
    areaKmlId,
    areaKmlName,
    areaKmlHectares,
    areaKmlLink,
    LINK_KML_AREA,
    LINK_KML,
    KML,
    productionPerHa,
  } = body;

  const totalHours = (finalMeter && initialMeter) ? (parseFloat(finalMeter) - parseFloat(initialMeter)).toFixed(2) : '0';
  const kmlName = KML || areaKmlName || '';
  const kmlLink = LINK_KML_AREA || LINK_KML || areaKmlLink || '';
  const estimatedArea = areaEstimated || areaKmlHectares || '';

  try {
    console.log('Attempting to append to spreadsheet:', spreadsheetId);

    try {
      await sheets.spreadsheets.get({ spreadsheetId });
    } catch (getError: any) {
      console.error('Spreadsheet verification failed:', getError.message);
      if (getError.response?.status === 404) {
        return NextResponse.json({
          error: `Planilha não encontrada (ID: ${maskedId}). Verifique se o ID está correto nos Secrets e se a planilha não foi excluída.`,
          details: getError.response?.data
        }, { status: 404 });
      }
      throw getError;
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [
          [
            initialMeter,           // 1. HORIMETRO INICIAL
            operatorName,           // 2. OPERADOR
            tractor,                // 3. TRATOR
            implement,              // 4. IMPLEMENTO
            task,                   // 5. OPERAÇÃO
            crop,                   // 6. SAFRA/CAFÉ
            sector,                 // 7. SETOR
            finalMeter,             // 8. HORIMETRO FINAL
            date,                   // 9. DATA
            totalHours,             // 10. DURAÇÃO
            distanceGps || '',      // 11. DISTANCIA GPS
            estimatedArea,          // 12. AREA ESTIMADA / HECTARES DO KML
            kmlName,                // 13. KML
            kmlLink,                // 14. LINK KML
            entryId || areaKmlId || '', // 15. ENTRY_ID / AREA_KML_ID
            productionPerHa || ''   // 16. PRODUÇÃO POR HA
          ]
        ],
      },
    });
    console.log('Sheets append response:', response.status, response.statusText);
    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    console.error('Error appending to sheet:', error);

    const errorMessage = error.response?.data?.error?.message || error.message || 'Erro desconhecido';
    const statusCode = error.response?.status || 500;

    let userFriendlyMessage = `Erro ao salvar na planilha: ${errorMessage}`;

    if (errorMessage.includes('Requested entity was not found')) {
      userFriendlyMessage = `O Google não encontrou a planilha (ID: ${maskedId}). Por favor, verifique se o ID da planilha nos Secrets está correto.`;
    } else if (errorMessage.includes('API has not been used')) {
      userFriendlyMessage = 'A Google Sheets API não está ativada no seu projeto do Google Cloud. Por favor, ative-a no Console do Google Cloud.';
    }

    return NextResponse.json({
      error: userFriendlyMessage,
      details: error.response?.data || null
    }, { status: statusCode });
  }
}
