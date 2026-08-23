import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
    try {
        let serviceAccount = {};
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        } else if (process.env.FIREBASE_PRIVATE_KEY) {
            serviceAccount = {
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            };
        }

        initializeApp({
            credential: cert(serviceAccount),
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
    }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
