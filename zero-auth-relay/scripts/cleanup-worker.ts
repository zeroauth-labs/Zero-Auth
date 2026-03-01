import { cleanupExpiredSessions } from '../src/db.js';

const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

console.log(`[Cleanup Worker] Starting background session cleanup every ${CLEANUP_INTERVAL_MS}ms...`);

setInterval(async () => {
    try {
        await cleanupExpiredSessions();
    } catch (error) {
        console.error('[Cleanup Worker] Error during session cleanup:', error);
    }
}, CLEANUP_INTERVAL_MS);

// Run once immediately
cleanupExpiredSessions().catch(console.error);
