import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

jest.mock('firebase-admin/app', () => ({
    initializeApp: jest.fn(),
    getApps: jest.fn(),
    cert: jest.fn().mockImplementation((val) => val)
}));

jest.mock('firebase-admin/firestore', () => ({
    getFirestore: jest.fn().mockReturnValue({ id: 'firestore-mock' })
}));

jest.mock('firebase-admin/auth', () => ({
    getAuth: jest.fn().mockReturnValue({ id: 'auth-mock' })
}));

describe('firebaseAdmin', () => {
    const originalEnv = process.env;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
        process.env = { ...originalEnv };
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        process.env = originalEnv;
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    test('initializes with FIREBASE_SERVICE_ACCOUNT_KEY', () => {
        const { getApps, initializeApp, cert } = require('firebase-admin/app');
        getApps.mockReturnValue([]);
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({ key: 'value' });

        require('@/lib/firebaseAdmin');

        expect(cert).toHaveBeenCalledWith({ key: 'value' });
        expect(initializeApp).toHaveBeenCalledWith({ credential: { key: 'value' } });
        expect(consoleLogSpy).toHaveBeenCalledWith('Firebase Admin initialized successfully');
    });

    test('initializes with FIREBASE_PRIVATE_KEY', () => {
        const { getApps, initializeApp, cert } = require('firebase-admin/app');
        getApps.mockReturnValue([]);
        process.env.FIREBASE_PROJECT_ID = 'test-project';
        process.env.FIREBASE_CLIENT_EMAIL = 'test@example.com';
        process.env.FIREBASE_PRIVATE_KEY = 'test\\nkey';

        require('@/lib/firebaseAdmin');

        const expectedAccount = {
            projectId: 'test-project',
            clientEmail: 'test@example.com',
            privateKey: 'test\nkey' // \n unescaped
        };

        expect(cert).toHaveBeenCalledWith(expectedAccount);
        expect(initializeApp).toHaveBeenCalledWith({ credential: expectedAccount });
    });

    test('does not initialize if getApps().length > 0', () => {
        const { getApps, initializeApp } = require('firebase-admin/app');
        getApps.mockReturnValue([{ name: '[DEFAULT]' }]);
        
        require('@/lib/firebaseAdmin');

        expect(initializeApp).not.toHaveBeenCalled();
        expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    test('catches and logs initialization errors', () => {
        const { getApps, initializeApp } = require('firebase-admin/app');
        getApps.mockReturnValue([]);
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY = 'invalid-json'; // Will throw JSON.parse error

        require('@/lib/firebaseAdmin');

        expect(initializeApp).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith('Firebase Admin initialization error', expect.any(Error));
    });

    test('exports adminDb and adminAuth', () => {
        const { getApps } = require('firebase-admin/app');
        const { getFirestore } = require('firebase-admin/firestore');
        const { getAuth } = require('firebase-admin/auth');
        
        getApps.mockReturnValue([]);
        const { adminDb, adminAuth } = require('@/lib/firebaseAdmin');

        expect(getFirestore).toHaveBeenCalled();
        expect(getAuth).toHaveBeenCalled();
        expect(adminDb).toEqual({ id: 'firestore-mock' });
        expect(adminAuth).toEqual({ id: 'auth-mock' });
    });
});
