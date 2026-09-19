import { 
    createNoteAction, 
    updateNoteAction, 
    deleteNoteAction, 
    changeNoteStatusAction, 
    getUserStorageStatsAction 
} from '@/app/actions/notesActions';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

// Mock dependencies
jest.mock('@/lib/firebaseAdmin', () => ({
    adminDb: {
        collection: jest.fn(),
        runTransaction: jest.fn()
    },
    adminAuth: {
        verifyIdToken: jest.fn()
    }
}));

jest.mock('firebase-admin/firestore', () => ({
    FieldValue: {
        serverTimestamp: jest.fn().mockReturnValue('mocked-timestamp')
    }
}));

describe('notesActions', () => {
    const mockVerifyIdToken = adminAuth.verifyIdToken as jest.Mock;
    const mockCollection = adminDb.collection as jest.Mock;
    const mockRunTransaction = adminDb.runTransaction as jest.Mock;

    let mockTransaction: any;
    let mockUserStatsDocRef: any;
    let mockNoteDocRef: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Suppress console.error in tests
        jest.spyOn(console, 'error').mockImplementation(() => {});

        mockVerifyIdToken.mockResolvedValue({ uid: 'test-user-id' });

        mockUserStatsDocRef = { id: 'test-user-id', get: jest.fn(), update: jest.fn() };
        mockNoteDocRef = { id: 'new-note-id', get: jest.fn(), update: jest.fn() };

        mockCollection.mockImplementation((path) => {
            if (path === 'userStats') {
                return {
                    doc: jest.fn().mockReturnValue(mockUserStatsDocRef)
                };
            }
            if (path === 'notes') {
                return {
                    doc: jest.fn().mockReturnValue(mockNoteDocRef)
                };
            }
        });

        mockTransaction = {
            get: jest.fn(),
            set: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        };

        mockRunTransaction.mockImplementation(async (callback) => {
            return await callback(mockTransaction);
        });
    });

    describe('Authentication', () => {
        test('throws error if no token provided', async () => {
            await expect(createNoteAction('', 'content')).rejects.toThrow('Unauthorized: No token provided');
        });

        test('throws error if token is invalid', async () => {
            mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));
            await expect(createNoteAction('invalid', 'content')).rejects.toThrow('Unauthorized: Invalid token');
        });
    });

    describe('createNoteAction', () => {
        test('creates note successfully when under storage limit', async () => {
            // Mock transaction.get for userStats
            mockTransaction.get.mockResolvedValue({
                exists: true,
                data: () => ({ storageUsedInBytes: 1024 })
            });

            const result = await createNoteAction('token', 'Hello World');

            expect(result).toEqual({ success: true, noteId: 'new-note-id' });
            expect(mockTransaction.set).toHaveBeenCalledWith(mockNoteDocRef, expect.objectContaining({
                content: 'Hello World',
                userId: 'test-user-id',
                status: 'active'
            }));
            // Buffer.byteLength('Hello World', 'utf8') = 11
            expect(mockTransaction.set).toHaveBeenCalledWith(mockUserStatsDocRef, expect.objectContaining({
                storageUsedInBytes: 1024 + 11
            }), { merge: true });
        });

        test('creates note successfully for new user (no existing stats)', async () => {
            mockTransaction.get.mockResolvedValue({ exists: false });

            const result = await createNoteAction('token', 'A'); // 1 byte

            expect(result.success).toBe(true);
            expect(mockTransaction.set).toHaveBeenCalledWith(mockUserStatsDocRef, expect.objectContaining({
                storageUsedInBytes: 1
            }), { merge: true });
        });

        test('returns storage limit error if quota exceeded', async () => {
            const MAX_STORAGE = 10 * 1024 * 1024;
            mockTransaction.get.mockResolvedValue({
                exists: true,
                data: () => ({ storageUsedInBytes: MAX_STORAGE - 5 })
            });

            const result = await createNoteAction('token', '123456'); // 6 bytes

            expect(result).toEqual({ 
                success: false, 
                error: 'Storage limit exceeded! You can store up to 10MB of notes.' 
            });
            expect(mockTransaction.set).not.toHaveBeenCalled();
        });

        test('returns generic error on transaction failure', async () => {
            mockRunTransaction.mockRejectedValue(new Error('DB Error'));
            
            const result = await createNoteAction('token', 'test');
            
            expect(result).toEqual({
                success: false,
                error: 'An error occurred while creating the note.'
            });
        });
    });

    describe('updateNoteAction', () => {
        test('updates note successfully', async () => {
            mockTransaction.get
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({ storageUsedInBytes: 100 })
                }) // statsDoc
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({ userId: 'test-user-id', content: 'Old' }) // 3 bytes
                }); // noteDoc

            const result = await updateNoteAction('token', 'note-1', 'Newer'); // 5 bytes (diff +2)

            expect(result.success).toBe(true);
            expect(mockTransaction.update).toHaveBeenCalledWith(mockNoteDocRef, { content: 'Newer' });
            expect(mockTransaction.set).toHaveBeenCalledWith(mockUserStatsDocRef, expect.objectContaining({
                storageUsedInBytes: 102
            }), { merge: true });
        });

        test('fails if note does not exist', async () => {
            mockTransaction.get
                .mockResolvedValueOnce({ exists: true, data: () => ({}) })
                .mockResolvedValueOnce({ exists: false });

            const result = await updateNoteAction('token', 'note-1', 'New');
            
            expect(result.success).toBe(false);
        });

        test('fails if unauthorized access to note', async () => {
            mockTransaction.get
                .mockResolvedValueOnce({ exists: true, data: () => ({}) })
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({ userId: 'different-user' })
                });

            const result = await updateNoteAction('token', 'note-1', 'New');
            
            expect(result.success).toBe(false);
        });

        test('returns storage limit error on update', async () => {
            const MAX_STORAGE = 10 * 1024 * 1024;
            mockTransaction.get
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({ storageUsedInBytes: MAX_STORAGE - 1 })
                })
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({ userId: 'test-user-id', content: 'A' })
                });

            const result = await updateNoteAction('token', 'note-1', 'ABC'); // Diff +2
            
            expect(result.success).toBe(false);
            expect(result.error).toContain('Storage limit exceeded');
        });
    });

    describe('deleteNoteAction', () => {
        test('deletes note successfully and reduces storage', async () => {
            mockTransaction.get
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({ storageUsedInBytes: 100 })
                })
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({ userId: 'test-user-id', content: 'ABCD' }) // 4 bytes
                });

            const result = await deleteNoteAction('token', 'note-1');

            expect(result.success).toBe(true);
            expect(mockTransaction.delete).toHaveBeenCalledWith(mockNoteDocRef);
            expect(mockTransaction.set).toHaveBeenCalledWith(mockUserStatsDocRef, expect.objectContaining({
                storageUsedInBytes: 96
            }), { merge: true });
        });

        test('returns successfully if note already deleted', async () => {
            mockTransaction.get
                .mockResolvedValueOnce({ exists: true, data: () => ({}) })
                .mockResolvedValueOnce({ exists: false });

            const result = await deleteNoteAction('token', 'note-1');

            expect(result.success).toBe(true);
            expect(mockTransaction.delete).not.toHaveBeenCalled();
        });

        test('fails if unauthorized access', async () => {
            mockTransaction.get
                .mockResolvedValueOnce({ exists: true, data: () => ({}) })
                .mockResolvedValueOnce({
                    exists: true,
                    data: () => ({ userId: 'different-user' })
                });

            const result = await deleteNoteAction('token', 'note-1');

            expect(result.success).toBe(false);
        });
    });

    describe('changeNoteStatusAction', () => {
        test('updates status successfully', async () => {
            mockNoteDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({ userId: 'test-user-id' })
            });

            const result = await changeNoteStatusAction('token', 'note-1', { status: 'trash' });

            expect(result.success).toBe(true);
            expect(mockNoteDocRef.update).toHaveBeenCalledWith({ status: 'trash' });
        });

        test('fails if note does not exist', async () => {
            mockNoteDocRef.get.mockResolvedValue({ exists: false });

            const result = await changeNoteStatusAction('token', 'note-1', { status: 'trash' });

            expect(result.success).toBe(false);
        });

        test('fails if unauthorized', async () => {
            mockNoteDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({ userId: 'diff-user' })
            });

            const result = await changeNoteStatusAction('token', 'note-1', { status: 'trash' });

            expect(result.success).toBe(false);
        });
    });

    describe('getUserStorageStatsAction', () => {
        test('returns stats successfully', async () => {
            mockUserStatsDocRef.get.mockResolvedValue({
                exists: true,
                data: () => ({ storageUsedInBytes: 5000 })
            });

            const result = await getUserStorageStatsAction('token');

            expect(result).toEqual({
                success: true,
                storageUsedInBytes: 5000,
                maxStorageBytes: 10 * 1024 * 1024
            });
        });

        test('returns 0 if stats doc does not exist', async () => {
            mockUserStatsDocRef.get.mockResolvedValue({ exists: false });

            const result = await getUserStorageStatsAction('token');

            expect(result.storageUsedInBytes).toBe(0);
        });

        test('handles errors fetching stats', async () => {
            mockUserStatsDocRef.get.mockRejectedValue(new Error('Network'));

            const result = await getUserStorageStatsAction('token');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to fetch storage stats');
        });
    });
});
