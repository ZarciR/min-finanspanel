import express from 'express';
import cors from 'cors';
import { OAuth2Client } from 'google-auth-library';

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
      audience: '<DIN_GOOGLE_CLIENT_ID>', // samma som i frontend
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
