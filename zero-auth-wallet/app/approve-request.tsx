import { generateProof } from '@/lib/proof';
import { VerificationRequest } from '@/lib/qr-protocol';
import { checkRevocationStatus, RevocationStatus } from '@/lib/revocation';
import { useAuthStore } from '@/store/auth-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, Check, ShieldAlert, ShieldCheck, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

import { useZKEngine } from '@/components/ZKEngine';
import CustomAlert from '@/components/CustomAlert';

// Helper to get dynamic header text based on use_case
function getUseCaseText(useCase?: string, verifierName?: string): string {
    switch (useCase) {
        case 'LOGIN':
            return `Authenticate to ${verifierName || 'Service'}`;
        case 'TRIAL_LICENSE':
            return `Activate trial for ${verifierName || 'Service'}`;
        case 'VERIFICATION':
        default:
            return `Verify your identity to ${verifierName || 'Service'}`;
    }
}

// Helper to get colors based on use_case
function getUseCaseColors(useCase?: string, credentialType?: string): { primary: string; primaryBg: string; primaryBorder: string; icon: string } {
    switch (useCase) {
        case 'LOGIN':
            return {
                primary: '#a9b1d6',      // Neutral for login
                primaryBg: 'rgba(26, 27, 38, 0.6)',
                primaryBorder: 'rgba(255, 255, 255, 0.08)',
                icon: '#a9b1d6'
            };
        case 'TRIAL_LICENSE':
            return {
                primary: '#f472b6',      // Pink for trial
                primaryBg: 'rgba(244, 114, 182, 0.15)',
                primaryBorder: 'rgba(244, 114, 182, 0.3)',
                icon: '#f472b6'
            };
        case 'VERIFICATION':
        default:
            if (credentialType === 'Student ID') {
                return {
                    primary: '#bb9af7',      // Purple for University ID
                    primaryBg: 'rgba(187, 154, 247, 0.15)',
                    primaryBorder: 'rgba(187, 154, 247, 0.3)',
                    icon: '#bb9af7'
                };
            }
            return {
                primary: '#7aa2f7',      // Blue for verification
                primaryBg: 'rgba(122, 162, 247, 0.15)',
                primaryBorder: 'rgba(122, 162, 247, 0.3)',
                icon: '#7aa2f7'
            };
    }
}

// Helper to get action text
function getActionText(useCase?: string): string {
    switch (useCase) {
        case 'LOGIN':
            return 'Authenticate';
        case 'TRIAL_LICENSE':
            return 'Activate Trial';
        case 'VERIFICATION':
        default:
            return 'Approve';
    }
}

export default function ApproveRequestScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [request, setRequest] = useState<VerificationRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [revocationStatus, setRevocationStatus] = useState<RevocationStatus | null>(null);
    const [checkingRevocation, setCheckingRevocation] = useState(false);
    const zkEngine = useZKEngine();

    // Timer state for time-bound requests
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Get credentials to find a match
    const credentials = useAuthStore((state) => state.credentials);

    // Check if this is a no-claims request (e.g., just login without specific attributes)
    const isNoClaimsRequest = !request?.required_claims || request.required_claims.length === 0;

    // Credential Selection Engine: Find ALL credentials that match the request
    const matchingCredentials = request ? credentials.filter(c => {
        // If no claims requested, any credential of the right type can be used
        if (isNoClaimsRequest) {
            return c.type === request.credential_type;
        }
        
        if (c.type !== request.credential_type) return false;
        
        // Check if credential has ALL required claims
        const credentialAttrs = Object.keys(c.attributes);
        const hasAllClaims = request.required_claims.every(claim => 
            credentialAttrs.includes(claim)
        );
        
        return hasAllClaims;
    }) : [];

    // Selected credential state (for when multiple match)
    const [selectedCredentialIndex, setSelectedCredentialIndex] = useState(0);
    const selectedCredential = matchingCredentials[selectedCredentialIndex] || null;

    // For no-claims requests, we need at least one credential of the right type
    // For requests with claims, we need a credential that has all the required claims
    const needsCredential = !isNoClaimsRequest;
    const canApprove = !needsCredential || selectedCredential !== null;

    // Alert modal state
    const [alertState, setAlertState] = useState<{
        visible: boolean;
        type: 'error' | 'success' | 'warning' | 'info';
        title: string;
        message: string;
        onConfirm?: () => void;
    }>({ visible: false, type: 'info', title: '', message: '' });

    // Revocation warning acknowledged state
    const [revocationWarningAcknowledged, setRevocationWarningAcknowledged] = useState(false);

    // Countdown timer effect
    useEffect(() => {
        if (!request?.expires_at) return;

        const calculateRemaining = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = request.expires_at - now;
            return remaining > 0 ? remaining : 0;
        };

        setTimeRemaining(calculateRemaining());

        countdownRef.current = setInterval(() => {
            const remaining = calculateRemaining();
            setTimeRemaining(remaining);
            
            if (remaining <= 0) {
                if (countdownRef.current) clearInterval(countdownRef.current);
                setAlertState({
                    visible: true,
                    type: 'error',
                    title: 'Expired',
                    message: 'This verification request has expired.',
                    onConfirm: () => {
                        setAlertState(prev => ({ ...prev, visible: false }));
                        router.back();
                    }
                });
            }
        }, 1000);

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [request?.expires_at]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (params.request) {
            try {
                const parsed = JSON.parse(params.request as string);
                setRequest(parsed);
            } catch (e) {
                setAlertState({
                    visible: true,
                    type: 'error',
                    title: 'Error',
                    message: 'Invalid request data',
                    onConfirm: () => {
                        setAlertState(prev => ({ ...prev, visible: false }));
                        router.back();
                    }
                });
            }
        }
    }, [params.request]);

    const handleApprove = async () => {
        if (!selectedCredential) return;

        // Reset revocation warning state
        setRevocationWarningAcknowledged(false);

        // 1. Authenticate (Biometric Gate) - Respect User Preference
        const biometricsEnabled = useAuthStore.getState().biometricsEnabled;
        const pinHash = useAuthStore.getState().pinHash;

        if (biometricsEnabled) {
            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirm identity to generate ZK proof',
                fallbackLabel: 'Use PIN',
            });

            // If biometric fails, try PIN fallback if available
            if (!auth.success) {
                if (pinHash && auth.error === 'user_fallback') {
                    // PIN fallback - in a real app, show a PIN input modal
                    // For now, we'll proceed (in production, show PIN modal)
                    console.log('PIN fallback requested');
                } else if (!pinHash) {
                    // No PIN fallback available
                    setLoading(false);
                    return;
                }
            }
        }

        // 2. Check Revocation Status Before Generating Proof (SEC-04)
        setCheckingRevocation(true);
        try {
            const revocationResult = await checkRevocationStatus(selectedCredential);
            setRevocationStatus(revocationResult.status);
            
            if (revocationResult.isRevoked) {
                setAlertState({
                    visible: true,
                    type: 'error',
                    title: 'Credential Revoked',
                    message: 'This credential has been revoked and cannot be used for verification. Please contact your issuer for a new credential.',
                    onConfirm: () => {
                        setAlertState(prev => ({ ...prev, visible: false }));
                        router.back();
                    }
                });
                setLoading(false);
                setCheckingRevocation(false);
                return;
            }
            
            if (revocationResult.status === 'unknown') {
                // Show warning but allow proceeding - user must explicitly acknowledge
                setAlertState({
                    visible: true,
                    type: 'warning',
                    title: 'Warning: Unable to Verify',
                    message: "We couldn't verify the revocation status of this credential. Do you want to proceed anyway?",
                    onConfirm: () => {
                        setAlertState(prev => ({ ...prev, visible: false }));
                        setRevocationWarningAcknowledged(true);
                        // Continue with proof generation after warning acknowledged
                        proceedWithProof();
                    }
                });
                setCheckingRevocation(false);
                return;
            }
        } catch (e) {
            console.warn("Revocation check failed:", e);
            setRevocationStatus('unknown');
        } finally {
            setCheckingRevocation(false);
        }

        // If we get here, proceed with proof generation
        await proceedWithProof();
    };

    // Separate function for proof generation (called after warning acknowledged)
    const normalizeProof = (rawProof: any) => {
        if (!rawProof) return rawProof;

        const toString = (value: any) => (typeof value === 'bigint' ? value.toString() : String(value));
        const normalizePair = (pair: any[]) => [toString(pair[0]), toString(pair[1])];
        const normalizeArrayLike = (value: any) => {
            if (Array.isArray(value)) return value;
            if (value && typeof value === 'object') {
                const keys = Object.keys(value)
                    .filter((key) => String(Number(key)) === key)
                    .sort((a, b) => Number(a) - Number(b));
                if (keys.length > 0) {
                    return keys.map((key) => value[key]);
                }
            }
            return [];
        };

        const piA = normalizeArrayLike(rawProof.pi_a);
        const piB = normalizeArrayLike(rawProof.pi_b);
        const piC = normalizeArrayLike(rawProof.pi_c);

        return {
            pi_a: piA.length >= 2 ? normalizePair(piA) : piA,
            pi_b: piB.length >= 2 ? [normalizePair(piB[0]), normalizePair(piB[1]), ...(piB[2] ? [normalizePair(piB[2])] : [])] : piB,
            pi_c: piC.length >= 2 ? normalizePair(piC) : piC,
            protocol: rawProof.protocol,
            curve: rawProof.curve,
            publicSignals: Array.isArray(rawProof.publicSignals)
                ? rawProof.publicSignals.map(toString)
                : rawProof.publicSignals
        };
    };

    const proceedWithProof = async () => {
        // For no-claims requests, we can proceed without a specific credential
        // Just generate a simple proof with no attributes
        if (!request) return;
        
        setLoading(true);
        try {
            let proof;
            let cred = selectedCredential;
            
            // If no credential selected but needed, try to use the first matching one
            if (!cred && matchingCredentials.length > 0) {
                cred = matchingCredentials[0];
            }
            
            // If still no credential and we need one, fail
            if (!cred) {
                throw new Error("No matching credential found for this verification request");
            }
            
            // Retrieve persisted salt
            const salt = await SecureStore.getItemAsync(`salt_${cred.id}`);
            if (!salt) throw new Error("Secure salt missing for this credential");

            console.log("Generating proof for:", cred.id);
            const rawProof = await generateProof(zkEngine, request, cred, salt);
            proof = normalizeProof(rawProof);
            
            console.log("Proof generated, type:", proof ? typeof proof : 'undefined');
            console.log("Proof keys:", proof ? Object.keys(proof) : 'none');
            console.log("Proof credential_type:", proof?.credential_type);

            // 3. Post Proof to Relay
            let callbackUrl = request.verifier.callback;

            console.log("Submitting proof to:", callbackUrl);
            console.log("Proof payload:", JSON.stringify({ proof: proof }).substring(0, 200));
            
            let response;
            try {
                response = await fetch(callbackUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ proof: proof })
                });
            } catch (networkError: any) {
                console.error("[Proof] Network error during submission:", networkError);
                // Check if it's a network connectivity issue
                if (networkError.message?.includes('Network request failed') || 
                    networkError.message?.includes('fetch failed') ||
                    networkError.message?.includes('Network error')) {
                    throw new Error("Network error - check your internet connection and try again. Make sure you're not on airplane mode.");
                }
                throw new Error(`Network error: ${networkError.message || 'Unable to reach server at ' + callbackUrl}`);
            }

            console.log("[Proof] Response status:", response.status);
            console.log("[Proof] Response headers:", JSON.stringify([...response.headers.entries()]));
            
            if (!response.ok) {
                let errorJson: any = null;
                let errorText = '';
                try {
                    errorJson = await response.json();
                    console.error("[Proof] Server error response:", errorJson);
                } catch (e) {
                    try {
                        errorText = await response.text();
                        console.error("[Proof] Non-JSON error response:", errorText);
                    } catch (readError) {
                        errorText = '';
                    }
                }

                const errorCode = errorJson?.code;
                if (errorCode === 'ZK_VERIFICATION_FAILED') {
                    throw new Error(`ZK proof verification failed on server. The proof generated by your wallet was rejected. This may indicate a circuit mismatch or corrupted proof data.`);
                } else if (errorCode === 'ZK_VERIFICATION_KEY_MISSING') {
                    throw new Error(`Server not configured for ZK verification. Please contact the verifier administrator.`);
                } else if (errorCode === 'SESSION_NOT_FOUND') {
                    throw new Error(`Session expired or not found. The verification request may have timed out.`);
                } else if (errorCode === 'SESSION_ALREADY_COMPLETED') {
                    throw new Error(`This session has already been completed.`);
                } else if (errorCode === 'DUPLICATE_PROOF') {
                    throw new Error(`This proof has already been submitted for this session.`);
                } else if (errorCode === 'INVALID_PROOF_SCHEMA') {
                    throw new Error(`Proof structure is invalid: ${JSON.stringify(errorJson?.details?.errors || [])}`);
                }

                const errorMessage = errorText || (errorJson ? JSON.stringify(errorJson) : 'Unknown error');
                throw new Error(`Server rejected proof (${response.status}): ${errorMessage.substring(0, 200)}`);
            }

            console.log("Proof Submitted Successfully");

            // Success - add to session history and show success
            useAuthStore.getState().addSession({
                remoteId: request?.session_id || '',
                callbackUrl: request?.verifier.callback || '',
                serviceName: request?.verifier.name || 'Unknown Verifier',
                type: request?.credential_type as any,
                infoRequested: request?.required_claims || [],
                verifierDid: request?.verifier.did,
                nonce: request?.nonce
            });
            
            setAlertState({
                visible: true,
                type: 'success',
                title: 'Success',
                message: 'Verification Complete! Proof submitted to verifier.',
                onConfirm: () => {
                    setAlertState(prev => ({ ...prev, visible: false }));
                    router.replace('/(tabs)');
                }
            });
        } catch (e: any) {
            console.error(e);
            setAlertState({
                visible: true,
                type: 'error',
                title: 'Error',
                message: e?.message || "Failed to generate proof",
            });
        } finally {
            setLoading(false);
        }
    };

    if (!request) return <View className="flex-1 bg-background" />;

    // Get dynamic header text based on use_case
    const headerText = getUseCaseText(request.use_case, request.verifier.name);
    const actionText = getActionText(request.use_case);
    const useCaseColors = getUseCaseColors(request.use_case, request.credential_type);

    return (
        <SafeAreaView className="flex-1 bg-background p-6">
            <View className="flex-1">
                {/* Header */}
                <View className="items-center mb-8 mt-4">
                    <View 
                        className="w-20 h-20 rounded-full items-center justify-center mb-4 border"
                        style={{ backgroundColor: useCaseColors.primaryBg, borderColor: useCaseColors.primaryBorder }}
                    >
                        <ShieldCheck size={40} color={useCaseColors.icon} />
                    </View>
                    <Text className="text-muted-foreground uppercase text-xs font-bold tracking-widest mb-2">
                        {request.use_case === 'LOGIN' ? 'Authentication Request' : request.use_case === 'TRIAL_LICENSE' ? 'Trial Access' : 'Verification Request'}
                    </Text>
                    <Text className="text-foreground text-2xl font-bold text-center">{headerText}</Text>
                    <Text className="text-xs font-mono mt-1" style={{ color: useCaseColors.primary }}>{request.verifier.did}</Text>
                    {timeRemaining !== null && timeRemaining > 0 && (
                        <View 
                            className={`mt-2 px-3 py-1 rounded-full`}
                            style={{ 
                                backgroundColor: timeRemaining < 60 ? 'rgba(248, 113, 113, 0.2)' : useCaseColors.primaryBg,
                                borderColor: timeRemaining < 60 ? 'rgba(248, 113, 113, 0.4)' : useCaseColors.primaryBorder
                            }}
                        >
                            <Text 
                                className={`text-xs font-mono`}
                                style={{ color: timeRemaining < 60 ? '#f87171' : useCaseColors.primary }}
                            >
                                Expires in: {formatTime(timeRemaining)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Request Details */}
                <View className="bg-card p-5 rounded-2xl border border-white/5 mb-6">
                    <Text className="text-muted-foreground text-xs font-bold uppercase mb-4">
                        {request.use_case === 'LOGIN' ? 'Requesting Authentication' : 'Requesting to Verify'}
                    </Text>

                    {isNoClaimsRequest ? (
                        <View 
                            className="px-4 py-3 rounded-xl border mb-4"
                            style={{ backgroundColor: useCaseColors.primaryBg, borderColor: useCaseColors.primaryBorder }}
                        >
                                <Text className="text-sm font-medium" style={{ color: useCaseColors.primary }}>
                                    {request.use_case === 'LOGIN'
                                        ? 'No specific attributes required - authenticate with your credential'
                                        : 'No specific attributes required - just verify you have a valid credential'}
                                </Text>
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap gap-2 mb-4">
                            {request.required_claims.map((claim) => (
                                <View key={claim} className="bg-background px-3 py-2 rounded-lg border border-border flex-row items-center gap-2">
                                    <BadgeCheck size={14} color="#9ece6a" />
                                    <Text className="text-foreground text-sm font-medium">{claim.replace(/_/g, ' ')}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <View className="h-[1px] bg-border/50 my-2" />

                    <Text className="text-muted-foreground text-xs font-bold uppercase mb-2 mt-2">
                        {matchingCredentials.length > 1 ? 'Select Credential' : 'Using Credential'}
                    </Text>
                    
                    {matchingCredentials.length > 1 ? (
                        // Multiple credentials - show carousel/selection
                        <View className="space-y-3">
                            {/* Credential Selection Carousel */}
                            <View className="flex-row items-center justify-between bg-secondary/5 p-2 rounded-xl">
                                <TouchableOpacity 
                                    onPress={() => setSelectedCredentialIndex(prev => Math.max(0, prev - 1))}
                                    disabled={selectedCredentialIndex === 0}
                                    className={`p-2 rounded-full ${selectedCredentialIndex === 0 ? 'opacity-30' : 'active:bg-secondary/20'}`}
                                >
                                    <ChevronLeft size={20} color="#9ca3af" />
                                </TouchableOpacity>
                                
                                <View className="flex-1 px-3">
                                    {selectedCredential && (
                                        <View className="flex-row items-center gap-3 bg-secondary/10 p-3 rounded-xl border border-secondary/20">
                                            <View className="w-10 h-10 bg-secondary/20 rounded-full items-center justify-center">
                                                <Check size={20} color="#bb9af7" />
                                            </View>
                                            <View>
                                                <Text className="text-foreground font-bold">{selectedCredential.type}</Text>
                                                <Text className="text-muted-foreground text-xs">{selectedCredential.issuer}</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                                
                                <TouchableOpacity 
                                    onPress={() => setSelectedCredentialIndex(prev => Math.min(matchingCredentials.length - 1, prev + 1))}
                                    disabled={selectedCredentialIndex === matchingCredentials.length - 1}
                                    className={`p-2 rounded-full ${selectedCredentialIndex === matchingCredentials.length - 1 ? 'opacity-30' : 'active:bg-secondary/20'}`}
                                >
                                    <ChevronRight size={20} color="#9ca3af" />
                                </TouchableOpacity>
                            </View>
                            
                            {/* Page indicator */}
                            <View className="flex-row justify-center gap-1">
                                {matchingCredentials.map((_, idx) => (
                                    <View 
                                        key={idx} 
                                        className={`h-1.5 rounded-full ${idx === selectedCredentialIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted'}`}
                                    />
                                ))}
                            </View>
                        </View>
                    ) : selectedCredential ? (
                        // Single credential - show as before
                        <View className="space-y-2">
                            <View className="flex-row items-center gap-3 bg-secondary/10 p-3 rounded-xl border border-secondary/20">
                                <View className="w-10 h-10 bg-secondary/20 rounded-full items-center justify-center">
                                    <Check size={20} color="#bb9af7" />
                                </View>
                                <View>
                                    <Text className="text-foreground font-bold">{selectedCredential.type}</Text>
                                    <Text className="text-muted-foreground text-xs">{selectedCredential.issuer}</Text>
                                </View>
                            </View>
                        </View>
                    ) : null}

                    {/* Revocation Status Indicator */}
                    {(selectedCredential || matchingCredentials.length > 0) && (
                        <View className={`flex-row items-center gap-2 px-3 py-2 rounded-lg mt-3 ${
                            revocationStatus === 'valid' ? 'bg-green-500/10 border border-green-500/20' :
                            revocationStatus === 'revoked' ? 'bg-red-500/10 border border-red-500/20' :
                            revocationStatus === 'unknown' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                            'bg-muted/10 border border-muted/20'
                        }`}>
                            {revocationStatus === 'valid' && <BadgeCheck size={14} color="#4ade80" />}
                            {revocationStatus === 'revoked' && <ShieldAlert size={14} color="#f87171" />}
                            {revocationStatus === 'unknown' && <ShieldAlert size={14} color="#fbbf24" />}
                            {!revocationStatus && <ShieldCheck size={14} color="#9ca3af" />}
                            <Text className={`text-xs font-medium ${
                                revocationStatus === 'valid' ? 'text-green-400' :
                                revocationStatus === 'revoked' ? 'text-red-400' :
                                revocationStatus === 'unknown' ? 'text-yellow-400' :
                                'text-muted-foreground'
                            }`}>
                                {revocationStatus === 'valid' ? 'Valid - Not Revoked' :
                                 revocationStatus === 'revoked' ? 'REVOKED' :
                                 revocationStatus === 'unknown' ? 'Status Unknown - Proceed with caution' :
                                 'Checking...'}
                            </Text>
                        </View>
                    )}

                    {matchingCredentials.length === 0 && (
                        <View className="flex-row items-center gap-3 bg-error/10 p-3 rounded-xl border border-error/20">
                            <ShieldAlert size={20} color="#f7768e" />
                            <View>
                                <Text className="text-error font-bold">No matching credential found</Text>
                                <Text className="text-[#565f89] text-xs">
                                    {isNoClaimsRequest 
                                        ? `No ${request.credential_type} credential found` 
                                        : `Requesting: ${request.required_claims.join(', ')}`}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {/* Actions */}
            <View className="gap-3">
                <TouchableOpacity
                    onPress={handleApprove}
                    disabled={!canApprove || loading || checkingRevocation || (timeRemaining !== null && timeRemaining <= 0)}
                    style={{
                        backgroundColor: (!canApprove || loading || checkingRevocation || (timeRemaining !== null && timeRemaining <= 0)) 
                            ? '#3f3f46' 
                            : useCaseColors.primary
                    }}
                    className={`p-4 rounded-xl flex-row items-center justify-center gap-2`}
                >
                    {loading || checkingRevocation ? (
                        <ActivityIndicator color="#1a1b26" />
                    ) : (
                        <>
                            <Check size={20} color="#1a1b26" />
                            <Text className="text-[#1a1b26] font-bold text-lg">{actionText}</Text>
                        </>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.back()}
                    disabled={loading}
                    className="bg-card border border-white/10 p-4 rounded-xl flex-row items-center justify-center gap-2"
                >
                    <X size={20} color="#f7768e" />
                    <Text className="text-error font-bold text-lg">Reject</Text>
                </TouchableOpacity>
            </View>

            {/* Custom Alert Modal */}
            <CustomAlert 
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                confirmText={alertState.type === 'warning' ? 'Proceed Anyway' : 'OK'}
                cancelText={alertState.type === 'warning' ? 'Cancel' : ''}
                onConfirm={() => {
                    if (alertState.onConfirm) {
                        alertState.onConfirm();
                    } else {
                        setAlertState(prev => ({ ...prev, visible: false }));
                    }
                }}
                onCancel={() => {
                    setAlertState(prev => ({ ...prev, visible: false }));
                    if (alertState.type === 'warning') {
                        setLoading(false);
                        setCheckingRevocation(false);
                    }
                }}
                type={alertState.type}
            />
        </SafeAreaView>
    );
}
