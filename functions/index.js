"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const server_1 = require("@simplewebauthn/server");
// Initialize Firebase Admin only if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp();
    }
    catch (error) {
        console.log('Firebase Admin already initialized');
    }
}
const db = admin.firestore();
const app = (0, express_1.default)();
// CORS configuration (echo request origin; suitable for dev/prod mix)
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// Universal CORS headers (defensive) and preflight short-circuit
app.use((req, res, next) => {
    const origin = req.get('origin') || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    next();
});
// Keep cors middleware as well (harmless with above guard)
app.options('*', (0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
const rpName = 'Grow With Me';
// Use environment variable or detect based on request origin
const getRpID = (req) => {
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
const getAllowedOrigins = (req) => {
    const origin = req.get('origin') || req.get('referer');
    console.log('Request origin for allowedOrigins:', origin);
    const list = [
        'http://localhost:5173',
        'https://grow-with-me-ai.vercel.app',
    ];
    if (origin && !list.includes(origin))
        list.push(origin);
    return list;
};
app.post('/webauthn/register/begin', async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid)
            return res.status(400).json({ error: 'missing uid' });
        const credsSnap = await db.collection('users').doc(uid).collection('webauthnCredentials').get();
        const excludeCredentials = credsSnap.docs.map(d => ({
            id: Buffer.from(d.get('credentialId'), 'base64url'),
            type: 'public-key'
        }));
        const options = await (0, server_1.generateRegistrationOptions)({
            rpName,
            rpID: getRpID(req),
            userID: uid,
            userName: uid,
            attestationType: 'none',
            authenticatorSelection: {
                residentKey: 'required',
                requireResidentKey: true,
                userVerification: 'preferred'
            },
            excludeCredentials,
        });
        await db.collection('users').doc(uid).set({
            currentChallenge: options.challenge
        }, { merge: true });
        res.json(options);
    }
    catch (e) {
        console.error('Registration begin error:', e);
        res.status(500).json({ error: 'server_error' });
    }
});
app.post('/webauthn/register/finish', async (req, res) => {
    try {
        const { uid, response } = req.body;
        if (!uid || !response)
            return res.status(400).json({ error: 'missing params' });
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        const expectedChallenge = userDoc.get('currentChallenge');
        const verification = await (0, server_1.verifyRegistrationResponse)({
            response,
            expectedChallenge,
            expectedOrigin: getAllowedOrigins(req),
            expectedRPID: getRpID(req),
        });
        if (!verification.verified || !verification.registrationInfo) {
            return res.status(400).json({ error: 'verification_failed', details: verification });
        }
        const { credentialPublicKey, credentialID, counter } = verification.registrationInfo;
        const record = {
            credentialId: Buffer.from(credentialID).toString('base64url'),
            publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
            counter,
            // Attempt to persist client-reported transports for better UX later
            transports: response?.response?.transports || undefined,
            userEmail: req.body.userEmail,
            userProvider: req.body.userProvider,
            createdAt: new Date(),
        };
        await userRef.collection('webauthnCredentials').doc(record.credentialId).set(record);
        await userRef.set({
            currentChallenge: admin.firestore.FieldValue.delete()
        }, { merge: true });
        res.json({ verified: true });
    }
    catch (e) {
        console.error('Registration finish error:', e);
        res.status(500).json({ error: 'server_error' });
    }
});
app.post('/webauthn/login/begin', async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid)
            return res.status(400).json({ error: 'missing uid' });
        const credsSnap = await db.collection('users').doc(uid).collection('webauthnCredentials').get();
        const allowCredentials = credsSnap.docs.map(d => ({
            id: Buffer.from(d.get('credentialId'), 'base64url'),
            type: 'public-key'
        }));
        const options = await (0, server_1.generateAuthenticationOptions)({
            rpID: getRpID(req),
            userVerification: 'preferred',
            // Allow discovery of any credential for this RP ID (enables cross-device/phone passkeys)
            allowCredentials: undefined,
        });
        await db.collection('users').doc(uid).set({
            currentChallenge: options.challenge
        }, { merge: true });
        res.json(options);
    }
    catch (e) {
        console.error('Login begin error:', e);
        res.status(500).json({ error: 'server_error' });
    }
});
app.post('/webauthn/login/finish', async (req, res) => {
    try {
        const { uid, response } = req.body;
        if (!uid || !response)
            return res.status(400).json({ error: 'missing params' });
        const userRef = db.collection('users').doc(uid);
        const userDoc = await userRef.get();
        const expectedChallenge = userDoc.get('currentChallenge');
        const credsSnap = await userRef.collection('webauthnCredentials').get();
        const credentials = credsSnap.docs.map(d => d.data());
        const getById = (id) => credentials.find(c => c.credentialId === id);
        const verification = await (0, server_1.verifyAuthenticationResponse)({
            response,
            expectedChallenge,
            expectedOrigin: getAllowedOrigins(req),
            expectedRPID: getRpID(req),
            authenticator: (() => {
                const id = response.id;
                const rec = getById(id);
                if (!rec)
                    return undefined;
                return {
                    credentialID: Buffer.from(rec.credentialId, 'base64url'),
                    credentialPublicKey: Buffer.from(rec.publicKey, 'base64url'),
                    counter: rec.counter,
                    transports: rec.transports,
                };
            })(),
        });
        if (!verification.verified || !verification.authenticationInfo) {
            return res.status(400).json({ error: 'verification_failed', details: verification });
        }
        const { newCounter, credentialID } = verification.authenticationInfo;
        await userRef.collection('webauthnCredentials')
            .doc(Buffer.from(credentialID).toString('base64url'))
            .set({ counter: newCounter }, { merge: true });
        await userRef.set({
            currentChallenge: admin.firestore.FieldValue.delete()
        }, { merge: true });
        res.json({ verified: true });
    }
    catch (e) {
        console.error('Login finish error:', e);
        res.status(500).json({ error: 'server_error' });
    }
});
exports.api = functions.https.onRequest(app);
