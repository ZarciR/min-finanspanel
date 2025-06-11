import express from 'express';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_JSON);
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

const app = express();
const PORT = process.env.PORT || 5000;
const client = new OAuth2Client();

const AUTHORIZED_EMAIL = process.env.AUTHORIZED_USER_EMAIL || 'ola.morin@gmail.com';

app.use(cors());
app.use(express.json());

app.post('/verify-token', async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (payload.email === AUTHORIZED_EMAIL) {
      res.status(200).json({ success: true });
    } else {
      res.status(403).json({ success: false, message: 'Access denied' });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

app.get('/assets', async (req, res) => {
  try {
    const spreadsheetId = '1ELlHaXDHuEKQ5-7gN3mXE1Nnei-uDEEiXJKACKNRXyA';
    const range = 'Tillgångar/Skulder!A1:Z';
    const result = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const rows = result.data.values || [];
    if (rows.length < 2) return res.status(200).json([]);

    const header = rows[0];
    const tillgångsbeloppIndex = header.indexOf('Tillgångsbelopp');
    const bolagPrivatIndex = header.indexOf('Bolag/Privat');
    const datumIndex = header.indexOf('Uppdateringsdatum');

    if ([tillgångsbeloppIndex, bolagPrivatIndex, datumIndex].includes(-1)) {
      return res.status(400).json({ error: 'Required columns missing' });
    }

    const cleanValue = (val) => {
      if (!val) return 0;
      const cleaned = val.replace(/\s|kr|−/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    };

    const assets = rows.slice(1).map((row) => ({
      belopp: cleanValue(row[tillgångsbeloppIndex]),
      typ: row[bolagPrivatIndex] || '',
      datum: row[datumIndex] || '',
    }));

    res.status(200).json(assets);
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    res.status(500).json({ error: 'Failed to fetch assets data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
