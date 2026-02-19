import { zustandStorage } from '@/lib/storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export type ServiceType = 'Age Verification' | 'Student ID' | 'Email Alternative' | 'Trial access';

export interface Session {
    id: string; // Local wallet ID
    remoteId: string; // Relay session_id
    callbackUrl: string; // URL where proof was posted (used for revocation)
    serviceName: string;
    serviceIcon?: string;
    startTime: number;
    infoRequested: string[];
    status: 'active' | 'expired' | 'revoked';
    type: ServiceType;
    verifierDid?: string;
    nonce?: string;
    proofSignature?: string;
}

export interface Credential {
    id: string;
    issuer: string;
    issuerDid?: string;
    type: string;
    issuedAt: number;
    expiresAt?: number;
    attributes: Record<string, string | boolean | number | undefined>;
    commitments?: Record<string, string>; // Map of attribute key -> Poseidon commitment
    verified: boolean;
    revocationId?: string;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
}

export interface AuthState {
    sessions: Session[];
    history: Session[];
    credentials: Credential[];
    notifications: Notification[];
    _hasHydrated: boolean;

    // Actions
    setHasHydrated: (state: boolean) => void;
    addSession: (session: Omit<Session, 'id' | 'startTime' | 'status'>) => void;
    terminateSession: (id: string) => Promise<void>;
    addCredential: (credential: Credential) => void;
    removeCredential: (id: string) => void;
    addNotification: (title: string, message: string) => void;
    clearNotifications: () => void;
    clearHistory: () => void;
    seedDemoData: () => Promise<void>;
    biometricsEnabled: boolean;
    toggleBiometrics: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            // Start empty — no mocks
            sessions: [],
            history: [],
            credentials: [],
            notifications: [],
            biometricsEnabled: true,
            _hasHydrated: false,

            setHasHydrated: (state) => {
                set({ _hasHydrated: state });
            },

            addSession: (session) => set((state) => ({
                sessions: [
                    {
                        ...session,
                        id: Math.random().toString(36).substring(7),
                        startTime: Date.now(),
                        status: 'active'
                    },
                    ...state.sessions
                ]
            })),

            terminateSession: async (id) => {
                const state = get();
                const sessionToMove = state.sessions.find(s => s.id === id);
                if (!sessionToMove) return;

                // TRY REMOTE REVOCATION
                if (sessionToMove.callbackUrl && sessionToMove.remoteId) {
                    try {
                        const revocationUrl = sessionToMove.callbackUrl.replace('/proof', '');
                        console.log("Attempting remote revocation:", revocationUrl);
                        await fetch(revocationUrl, { method: 'DELETE' });
                    } catch (e) {
                        console.warn("Could not notify relay of revocation:", e);
                    }
                }

                set((state) => ({
                    sessions: state.sessions.filter(s => s.id !== id),
                    history: [{ ...sessionToMove, status: 'revoked' }, ...state.history],
                    notifications: [
                        {
                            id: Math.random().toString(36),
                            title: 'Session Ended',
                            message: `Access to ${sessionToMove.serviceName} has been revoked.`,
                            timestamp: Date.now(),
                            read: false
                        },
                        ...state.notifications
                    ]
                }));
            },

            addCredential: (credential) => {
                const state = get();
                const existing = state.credentials.find(c => c.type === credential.type);

                if (existing) {
                    set((state) => ({
                        credentials: [
                            ...state.credentials.filter(c => c.type !== credential.type),
                            credential
                        ],
                        notifications: [
                            {
                                id: Math.random().toString(36),
                                title: 'Credential Updated',
                                message: `Your ${credential.type} has been updated.`,
                                timestamp: Date.now(),
                                read: false
                            },
                            ...state.notifications
                        ]
                    }));
                } else {
                    set((state) => ({
                        credentials: [...state.credentials, credential]
                    }));
                }
            },

            removeCredential: (id) => set((state) => ({
                credentials: state.credentials.filter(c => c.id !== id)
            })),

            addNotification: (title, message) => set((state) => ({
                notifications: [
                    {
                        id: Math.random().toString(36),
                        title,
                        message,
                        timestamp: Date.now(),
                        read: false
                    },
                    ...state.notifications
                ]
            })),

            clearNotifications: () => set({ notifications: [] }),
            clearHistory: () => set({ history: [] }),

            seedDemoData: async () => {
                // Clear existing demo credentials to prevent type conflicts (e.g. Identity vs Age Verification)
                set((state) => ({
                    credentials: state.credentials.filter(c => !c.id.startsWith('demo-'))
                }));

                const demoCredentials: Credential[] = [
                    {
                        id: 'demo-age',
                        type: 'Age Verification', // Matches SDK default
                        issuer: 'Zero Auth Demo',
                        issuedAt: Date.now(),
                        verified: true,
                        attributes: {
                            'birth_year': '1995',
                            'country': 'US'
                        }
                    },
                    {
                        id: 'demo-student',
                        type: 'Student ID',
                        issuer: 'Global University',
                        issuedAt: Date.now(),
                        verified: true,
                        attributes: {
                            'expiry_year': '2027',
                            'university': 'Zero Auth Academy'
                        }
                    }
                ];

                // For each demo credential, we need a salt
                // NOTE: SecureStore is typically a React Native/Expo module.
                // If this is a web environment, you'll need to replace this with a web-compatible storage.
                for (const cred of demoCredentials) {
                    const salt = Math.floor(Math.random() * 1000000).toString();
                    // Use ID for consistency with verify.tsx/approve-request.tsx
                    await SecureStore.setItemAsync(`salt_${cred.id}`, salt);
                }

                set({ credentials: demoCredentials });
            },

            toggleBiometrics: () => set((state) => ({ biometricsEnabled: !state.biometricsEnabled })),
        }),
        {
            name: 'zero-auth-store',
            storage: createJSONStorage(() => zustandStorage),
            // Don't persist internal flags
            partialize: (state) => ({
                sessions: state.sessions,
                history: state.history,
                credentials: state.credentials,
                notifications: state.notifications,
                biometricsEnabled: state.biometricsEnabled,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
