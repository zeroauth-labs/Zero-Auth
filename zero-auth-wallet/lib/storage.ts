import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// Maximum storage quota: 5MB
const MAX_STORAGE_BYTES = 5 * 1024 * 1024;

/**
 * Custom storage adapter for Zustand's persist middleware.
 * Uses AsyncStorage under the hood for React Native compatibility.
 */
export const zustandStorage: StateStorage = {
    getItem: async (name: string): Promise<string | null> => {
        return await AsyncStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
        // Check storage quota before writing
        const currentUsage = await getStorageUsage();
        const newSize = new Blob([value]).size;
        
        if (currentUsage + newSize > MAX_STORAGE_BYTES) {
            throw new Error(`Storage quota exceeded. Current: ${currentUsage} bytes, Max: ${MAX_STORAGE_BYTES} bytes`);
        }
        
        await AsyncStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
        await AsyncStorage.removeItem(name);
    },
};

/**
 * Get current storage usage in bytes
 */
export async function getStorageUsage(): Promise<number> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        let totalSize = 0;
        
        for (const key of keys) {
            const value = await AsyncStorage.getItem(key);
            if (value) {
                totalSize += new Blob([value]).size;
            }
        }
        
        return totalSize;
    } catch (error) {
        console.warn('Failed to calculate storage usage:', error);
        return 0;
    }
}

/**
 * Get storage usage as a formatted string
 */
export async function getStorageUsageFormatted(): Promise<string> {
    const bytes = await getStorageUsage();
    
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Check if storage is below warning threshold (80% of max)
 */
export async function isStorageBelowWarningThreshold(): Promise<boolean> {
    const usage = await getStorageUsage();
    return usage < (MAX_STORAGE_BYTES * 0.8);
}

// Backup export interface
export interface WalletBackupData {
    version: number;
    exportedAt: number;
    credentials: any[];
    sessions: any[];
    // Note: salts are NOT exported for security reasons
}

/**
 * Export wallet data (credentials and sessions, excluding salts)
 */
export async function exportWalletData(credentials: any[], sessions: any[]): Promise<WalletBackupData> {
    const backupData: WalletBackupData = {
        version: 1,
        exportedAt: Date.now(),
        credentials: credentials.map(c => ({
            ...c,
            // Remove sensitive data that shouldn't be exported
            commitments: undefined
        })),
        sessions
    };
    
    return backupData;
}

/**
 * Import wallet data from backup
 */
export async function importWalletData(backupData: WalletBackupData): Promise<{
    credentials: any[];
    sessions: any[];
}> {
    // Validate backup data
    if (!backupData.version || !backupData.exportedAt) {
        throw new Error('Invalid backup data: missing version or exportedAt');
    }
    
    if (backupData.version > 1) {
        throw new Error(`Unsupported backup version: ${backupData.version}`);
    }
    
    return {
        credentials: backupData.credentials || [],
        sessions: backupData.sessions || []
    };
}
