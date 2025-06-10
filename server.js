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
const client = new OAuth2Client(); // Behöver ingen clientId här

app.use(cors());
app.use(express.json());

app.post('/verify-token', async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: 'env.GOOGLE_CLIENT_ID', // samma som i frontend
    });
    const payload = ticket.getPayload();

    if (payload.email === 'ola.morin@gmail.com') {
      res.status(200).json({ success: true });
    } else {
      res.status(403).json({ success: false, message: 'Access denied' });
    }
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get('/assets', async (req, res) => {
  try {
    const spreadsheetId = '1ELlHaXDHuEKQ5-7gN3mXE1Nnei-uDEEiXJKACKNRXyA';
    const range = 'Tillgångar/Skulder!A2:B';
    const result = await sheets.spreadsheets.values.get({ spreadsheetId, range });

    const data = (result.data.values || []).map(([kategori, värde]) => ({
      kategori,
      värde,
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunde inte hämta data' });
  }
});
