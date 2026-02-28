import { generateAndStoreIdentity, getWalletIdentity, isWalletInitialized, purgeWallet } from '@/lib/wallet';
import { bytesToHex } from '@noble/hashes/utils';
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const PRIVATE_KEY_ALIAS = 'zero_auth_sk';

interface WalletState {
    isInitialized: boolean;
    did: string | null;
    publicKeyHex: string | null;
    isLoading: boolean;

    // Actions
    checkInitialization: () => Promise<boolean>;
    initializeWallet: () => Promise<void>;
    resetWallet: () => Promise<void>;
    getRawPrivateKey: () => Promise<string | null>;
}

export const useWalletStore = create<WalletState>((set) => ({
    isInitialized: false,
    did: null,
    publicKeyHex: null,
    isLoading: true,

    checkInitialization: async () => {
        set({ isLoading: true });
        const exists = await isWalletInitialized();
        if (exists) {
            const identity = await getWalletIdentity();
            if (identity) {
                set({
                    isInitialized: true,
                    did: identity.did,
                    publicKeyHex: bytesToHex(identity.publicKey),
                    isLoading: false
                });
                return true;
            }
        }
        set({ isInitialized: false, did: null, publicKeyHex: null, isLoading: false });
        return false;
    },

    initializeWallet: async () => {
        set({ isLoading: true });
        try {
            const identity = await generateAndStoreIdentity();
            // Artificial delay for cooler UX (User request)
            await new Promise(resolve => setTimeout(resolve, 2000));

            set({
                isInitialized: true,
                did: identity.did,
                publicKeyHex: bytesToHex(identity.publicKey),
                isLoading: false
            });
        } catch (error) {
            console.error("Wallet gen failed:", error);
            set({ isLoading: false });
            throw error; // Rethrow so UI knows
        }
    },

    resetWallet: async () => {
        await purgeWallet();
        set({ isInitialized: false, did: null, publicKeyHex: null });
    },
    getRawPrivateKey: async () => {
        const pk = await SecureStore.getItemAsync(PRIVATE_KEY_ALIAS);
        return pk;
    }
}));
