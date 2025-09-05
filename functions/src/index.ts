import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error) {
    console.log('Firebase Admin already initialized');
  }
}

const db = admin.firestore();

const app = express();

// CORS configuration
app.use(cors({ 
  origin: ['http://localhost:5173', 'https://grow-with-me-ai.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

type CredentialRecord = {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
  // Add user account linking info
  userEmail?: string;
  userProvider?: string;
  createdAt: Date;
};

const rpName = 'Grow With Me';
// Use environment variable or detect based on request origin
const getRpID = (req: any) => {
  const origin = req.get('origin') || req.get('referer');
  console.log('Request origin:', origin);
  
  if (origin && origin.includes('localhost')) {
    return 'localhost';
  }
  if (origin && origin.includes('grow-with-me-ai.vercel.app')) {
    return 'grow-with-me-ai.vercel.app';
  }
  
  // For mobile apps or unknown origins, use the production domain
  // This ensures passkeys registered on web work on mobile
  return 'grow-with-me-ai.vercel.app';
};

const getOrigin = (req: any) => {
  const origin = req.get('origin') || req.get('referer');
  console.log('Request origin for getOrigin:', origin);
  
  if (origin) {
    return origin;
  }
  
  // For mobile apps or unknown origins, use the production domain
  return 'https://grow-with-me-ai.vercel.app';
};

app.post('/webauthn/register/begin', async (req, res) => {
  try {
    const { uid } = req.body as { uid: string };
    if (!uid) return res.status(400).json({ error: 'missing uid' });
    
    const credsSnap = await db.collection('users').doc(uid).collection('webauthnCredentials').get();
    const excludeCredentials = credsSnap.docs.map(d => ({ 
      id: Buffer.from(d.get('credentialId'), 'base64url'), 
      type: 'public-key' as const 
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID: getRpID(req),
      userID: uid,
      userName: uid,
      attestationType: 'none',
      authenticatorSelection: { 
        residentKey: 'preferred', 
        userVerification: 'preferred' 
      },
      excludeCredentials,
    });
    
    await db.collection('users').doc(uid).set({ 
      currentChallenge: options.challenge 
    }, { merge: true });
    
    res.json(options);
  } catch (e) {
    console.error('Registration begin error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/webauthn/register/finish', async (req, res) => {
  try {
    const { uid, response } = req.body as { uid: string; response: any };
    if (!uid || !response) return res.status(400).json({ error: 'missing params' });
    
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const expectedChallenge = userDoc.get('currentChallenge');
    
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpID(req),
    });
    
    if (!verification.verified || !verification.registrationInfo) {
      return res.status(400).json({ error: 'verification_failed' });
    }
    
    const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
    const record: CredentialRecord = {
      credentialId: Buffer.from(credentialID).toString('base64url'),
      publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
      counter,
      userEmail: req.body.userEmail,
      userProvider: req.body.userProvider,
      createdAt: new Date(),
    };
    
    await userRef.collection('webauthnCredentials').doc(record.credentialId).set(record);
    await userRef.set({ 
      currentChallenge: admin.firestore.FieldValue.delete() 
    }, { merge: true });
    
    res.json({ verified: true });
  } catch (e) {
    console.error('Registration finish error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/webauthn/login/begin', async (req, res) => {
  try {
    const { uid } = req.body as { uid: string };
    if (!uid) return res.status(400).json({ error: 'missing uid' });
    
    const credsSnap = await db.collection('users').doc(uid).collection('webauthnCredentials').get();
    const allowCredentials = credsSnap.docs.map(d => ({ 
      id: Buffer.from(d.get('credentialId'), 'base64url'), 
      type: 'public-key' as const 
    }));
    
    const options = await generateAuthenticationOptions({
      rpID: getRpID(req),
      userVerification: 'preferred',
      allowCredentials: allowCredentials.length ? allowCredentials : undefined,
    });
    
    await db.collection('users').doc(uid).set({ 
      currentChallenge: options.challenge 
    }, { merge: true });
    
    res.json(options);
  } catch (e) {
    console.error('Login begin error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

app.post('/webauthn/login/finish', async (req, res) => {
  try {
    const { uid, response } = req.body as { uid: string; response: any };
    if (!uid || !response) return res.status(400).json({ error: 'missing params' });
    
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    const expectedChallenge = userDoc.get('currentChallenge');
    
    const credsSnap = await userRef.collection('webauthnCredentials').get();
    const credentials = credsSnap.docs.map(d => d.data() as CredentialRecord);
    
    const getById = (id: string) => credentials.find(c => c.credentialId === id);
    
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpID(req),
      authenticator: (() => {
        const id = response.id as string;
        const rec = getById(id);
        if (!rec) return undefined as any;
        return {
          credentialID: Buffer.from(rec.credentialId, 'base64url'),
          credentialPublicKey: Buffer.from(rec.publicKey, 'base64url'),
          counter: rec.counter,
          transports: rec.transports as any,
        };
      })(),
    });
    
    if (!verification.verified || !verification.authenticationInfo) {
      return res.status(400).json({ error: 'verification_failed' });
    }
    
    const { newCounter, credentialID } = verification.authenticationInfo;
    await userRef.collection('webauthnCredentials')
      .doc(Buffer.from(credentialID).toString('base64url'))
      .set({ counter: newCounter }, { merge: true });
    
    await userRef.set({ 
      currentChallenge: admin.firestore.FieldValue.delete() 
    }, { merge: true });
    
    res.json({ verified: true });
  } catch (e) {
    console.error('Login finish error:', e);
    res.status(500).json({ error: 'server_error' });
  }
});

exports.api = functions.https.onRequest(app);

