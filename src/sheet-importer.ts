import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from 'google-auth-library'
import creds from '../creds.json';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
];

const jwt = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: SCOPES,
});

export type Pair = {
  first: string;
  second: string;
  value: string;
}

export type Sheet = {
  firstLetters: string[];
  secondLetters: string[];
  pairs: Pair[];
}

export async function loadSheet(sheetId: string, sheetName: string): Promise<Sheet> {
  const doc = new GoogleSpreadsheet(sheetId, jwt);
  try {
    await doc.loadInfo(true);
  } catch (error) {
    throw new Error(`Failed to load sheet: ${error}`);
  }
  
  const imagesSheet = doc.sheetsByTitle[sheetName];

  if (!imagesSheet) throw new Error(`Sheet not found: ${sheetName}`);

  const sheetRows = await imagesSheet.getRows();

  const start = imagesSheet.headerValues[0];
  const sideHeaders = sheetRows.map(row => {
    return row.get(start);
  })
  const topHeaders = imagesSheet.headerValues.slice(1);

  const pairs: Pair[] = [];

  for (let i = 0; i < sideHeaders.length; i++) {
    const rowHeader = sideHeaders[i];
    for (let j = 0; j < topHeaders.length; j++) {
      const colHeader = topHeaders[j];
      const pair: Pair = {
        first: colHeader,
        second: rowHeader,
        value: sheetRows[i].get(colHeader)?.trim(),
      }
      if (!pair.value) continue;
      pairs.push(pair);
    }
  }

  // Sort pairs by first letter then by second letter
  pairs.sort((a, b) => {
    if (a.first < b.first) return -1;
    if (a.first > b.first) return 1;
    if (a.second < b.second) return -1;
    if (a.second > b.second) return 1;
    return 0;
  });

  return {
    firstLetters: topHeaders,
    secondLetters: sideHeaders,
    pairs,
  };
}