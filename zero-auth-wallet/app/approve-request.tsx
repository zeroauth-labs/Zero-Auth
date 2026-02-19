import { generateProof } from '@/lib/proof';
import { VerificationRequest } from '@/lib/qr-protocol';
import { checkRevocationStatus, RevocationStatus } from '@/lib/revocation';
import { useAuthStore } from '@/store/auth-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, Check, ShieldAlert, ShieldCheck, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

import { useZKEngine } from '@/components/ZKEngine';

export default function ApproveRequestScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [request, setRequest] = useState<VerificationRequest | null>(null);
    const [loading, setLoading] = useState(false);
    const [revocationStatus, setRevocationStatus] = useState<RevocationStatus | null>(null);
    const [checkingRevocation, setCheckingRevocation] = useState(false);
    const zkEngine = useZKEngine();

    // Get credentials to find a match
    const credentials = useAuthStore((state) => state.credentials);

    useEffect(() => {
        if (params.request) {
            try {
                const parsed = JSON.parse(params.request as string);
                setRequest(parsed);
            } catch (e) {
                Alert.alert("Error", "Invalid request data");
                router.back();
            }
        }
    }, [params.request]);

    // Check revocation status when matching credential is found
    useEffect(() => {
        if (matchingCredential && !revocationStatus) {
            checkRevocationStatus(matchingCredential)
                .then(result => setRevocationStatus(result.status))
                .catch(() => setRevocationStatus('unknown'));
        }
    }, [matchingCredential]);

    const handleApprove = async () => {
        if (!matchingCredential) return;

        // 1. Authenticate (Biometric Gate) - Respect User Preference
        const biometricsEnabled = useAuthStore.getState().biometricsEnabled;

        if (biometricsEnabled) {
            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirm identity to generate ZK proof',
                fallbackLabel: 'Enter Passcode',
            });

            if (!auth.success) {
                setLoading(false);
                return;
            }
        }

        // 2. Check Revocation Status Before Generating Proof (SEC-04)
        setCheckingRevocation(true);
        try {
            const revocationResult = await checkRevocationStatus(matchingCredential);
            setRevocationStatus(revocationResult.status);
            
            if (revocationResult.isRevoked) {
                Alert.alert(
                    "Credential Revoked",
                    "This credential has been revoked and cannot be used for verification. Please contact your issuer for a new credential.",
                    [{ text: "OK", onPress: () => router.back() }]
                );
                setLoading(false);
                setCheckingRevocation(false);
                return;
            }
            
            if (revocationResult.status === 'unknown') {
                // Show warning but allow proceeding
                Alert.alert(
                    "Warning: Unable to Verify",
                    "We couldn't verify the revocation status of this credential. Do you want to proceed anyway?",
                    [
                        { text: "Cancel", style: "cancel", onPress: () => { setLoading(false); setCheckingRevocation(false); return; } },
                        { text: "Proceed", onPress: () => {} }
                    ]
                );
            }
        } catch (e) {
            console.warn("Revocation check failed:", e);
            setRevocationStatus('unknown');
        } finally {
            setCheckingRevocation(false);
        }

        setLoading(true);
        try {
            // Retrieve persisted salt
            const salt = await SecureStore.getItemAsync(`salt_${matchingCredential.id}`);
            if (!salt) throw new Error("Secure salt missing for this credential");

            console.log("Generating proof for:", matchingCredential.id);
            const proof = await generateProof(zkEngine, request!, matchingCredential, salt);

            // 3. Post Proof to Relay
            let callbackUrl = request!.verifier.callback;

            // DEV-ONLY: Ensure HTTP for local relay (no SSL in dev)
            // REMOVED: Relay now handles protocol correctly (https for ngrok, http for LAN)
            // if (__DEV__ && callbackUrl.startsWith('https://')) {
            //    callbackUrl = callbackUrl.replace('https://', 'http://');
            //    console.log(`[Dev] Downgraded to HTTP: ${callbackUrl}`);
            // }

            console.log("Submitting proof to:", callbackUrl);
            const response = await fetch(callbackUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(proof)
            });

            if (!response.ok) {
                throw new Error(`Failed to submit proof: ${response.statusText}`);
            }

            console.log("✅ Proof Submitted Successfully");

            Alert.alert("Success", "Verification Complete! Proof submitted to verifier.", [
                {
                    text: "OK",
                    onPress: () => {
                        // Add to session history
                        useAuthStore.getState().addSession({
                            remoteId: request?.session_id || '',
                            callbackUrl: request?.verifier.callback || '',
                            serviceName: request?.verifier.name || 'Unknown Verifier',
                            type: request?.credential_type as any,
                            infoRequested: request?.required_claims || [],
                            verifierDid: request?.verifier.did,
                            nonce: request?.nonce
                        });
                        router.replace('/(tabs)');
                    }
                }
            ]);
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "Failed to generate proof");
        } finally {
            setLoading(false);
        }
    };

    if (!request) return <View className="flex-1 bg-background" />;

    // Simple matching logic: find a credential of the requested type
    const matchingCredential = credentials.find(c => c.type === request.credential_type);

    return (
        <SafeAreaView className="flex-1 bg-background p-6">
            <View className="flex-1">
                {/* Header */}
                <View className="items-center mb-8 mt-4">
                    <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-4 border border-primary/20">
                        <ShieldCheck size={40} color="#7aa2f7" />
                    </View>
                    <Text className="text-muted-foreground uppercase text-xs font-bold tracking-widest mb-2">Verification Request</Text>
                    <Text className="text-foreground text-2xl font-bold text-center">{request.verifier.name}</Text>
                    <Text className="text-primary text-xs font-mono mt-1">{request.verifier.did}</Text>
                </View>

                {/* Request Details */}
                <View className="bg-card p-5 rounded-2xl border border-white/5 mb-6">
                    <Text className="text-muted-foreground text-xs font-bold uppercase mb-4">Requesting to Verify</Text>

                    <View className="flex-row flex-wrap gap-2 mb-4">
                        {request.required_claims.map((claim) => (
                            <View key={claim} className="bg-background px-3 py-2 rounded-lg border border-border flex-row items-center gap-2">
                                <BadgeCheck size={14} color="#9ece6a" />
                                <Text className="text-foreground text-sm font-medium">{claim.replace(/_/g, ' ')}</Text>
                            </View>
                        ))}
                    </View>

                    <View className="h-[1px] bg-border/50 my-2" />

                    <Text className="text-muted-foreground text-xs font-bold uppercase mb-2 mt-2">Using Credential</Text>
                    {matchingCredential ? (
                        <View className="space-y-2">
                            <View className="flex-row items-center gap-3 bg-secondary/10 p-3 rounded-xl border border-secondary/20">
                                <View className="w-10 h-10 bg-secondary/20 rounded-full items-center justify-center">
                                    <Check size={20} color="#bb9af7" />
                                </View>
                                <View>
                                    <Text className="text-foreground font-bold">{matchingCredential.type}</Text>
                                    <Text className="text-muted-foreground text-xs">{matchingCredential.issuer}</Text>
                                </View>
                            </View>
                            {/* Revocation Status Indicator */}
                            <View className={`flex-row items-center gap-2 px-3 py-2 rounded-lg ${
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
                                     revocationStatus === 'unknown' ? 'Status Unknown' :
                                     'Checking...'}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View className="flex-row items-center gap-3 bg-error/10 p-3 rounded-xl border border-error/20">
                            <ShieldAlert size={20} color="#f7768e" />
                            <Text className="text-error font-bold">No matching credential found</Text>
                        </View>
                    )}
                </View>

                {/* Privacy Note */}
                <View className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <Text className="text-primary text-xs text-center font-medium">
                        Zero Auth will generate a Zero-Knowledge Proof. {request.verifier.name} will NOT receive your raw data.
                    </Text>
                    <Text className="text-[#565f89] text-[9px] text-center mt-1">
                        Circuit: {request.credential_type} ZK-v1
                    </Text>
                </View>
            </View>

            {/* Actions */}
            <View className="gap-3">
                <TouchableOpacity
                    onPress={handleApprove}
                    disabled={!matchingCredential || loading || checkingRevocation}
                    className={`p-4 rounded-xl flex-row items-center justify-center gap-2 ${!matchingCredential || loading || checkingRevocation ? 'bg-muted' : 'bg-primary'
                        }`}
                >
                    {loading || checkingRevocation ? (
                        <ActivityIndicator color="#1a1b26" />
                    ) : (
                        <>
                            <Check size={20} color="#1a1b26" />
                            <Text className="text-[#1a1b26] font-bold text-lg">Approve</Text>
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
        </SafeAreaView>
    );
}
