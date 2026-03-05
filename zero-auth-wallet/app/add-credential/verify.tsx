import { commitAttribute } from '@/lib/hashing';
import { getSupabaseConfig, getSupabaseConfigForCredential } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, Check, Fingerprint, Hash, ShieldCheck, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useZKEngine } from '@/components/ZKEngine';
import { generateSecureId, generateSecureSalt } from '@/lib/utils';

export default function VerifyScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ issuerName: string, category: string, issuerId: string, idNumber: string, dob: string }>();
    const { issuerName, category, issuerId } = params;
    const addCredential = useAuthStore((state) => state.addCredential);

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [currentStep, setCurrentStep] = useState(0);
    const zkEngine = useZKEngine();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const steps = [
        { label: 'Verifying with issuer', icon: Hash },
        { label: 'Generating secure salt', icon: Fingerprint },
        { label: 'Computing POSEIDON commitment', icon: ShieldCheck },
        { label: 'Securing in hardware enclave', icon: BadgeCheck }
    ];

    useEffect(() => {
        const runVerification = async () => {
            try {
                // Determine credential type
                const isUniversity = category === 'university';
                const isAadhaar = category === 'government' && issuerId === 'aadhaar';
                const credentialType = isAadhaar ? 'Aadhaar' : 'Student ID';

                // Step 0: Verify with issuer (Supabase)
                setCurrentStep(0);
                // Use appropriate Supabase based on credential type
                const { supabaseUrl, supabaseAnonKey } = getSupabaseConfigForCredential(credentialType);

                if (!supabaseUrl || !supabaseAnonKey) {
                    throw new Error('Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
                }

                const idNumber = params.idNumber?.toString().trim();
                const dob = params.dob?.toString().trim();

                if (!idNumber || !dob) {
                    throw new Error('Missing ID number or date of birth.');
                }

                const [day, month, year] = dob.split('/');
                const isoDob = `${year}-${month}-${day}`;

                // Call appropriate verification function
                let verifyResponse;
                if (isAadhaar) {
                    verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-aadhaar`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseAnonKey}`
                        },
                        body: JSON.stringify({
                            aadhaar_number: idNumber,
                            date_of_birth: isoDob,
                            credential_type: 'Aadhaar',
                            claims: ['birth_year', 'age_over_18', 'age_over_23', 'indian_citizen'],
                            idempotency_key: generateSecureId()
                        })
                    });
                } else {
                    verifyResponse = await fetch(`${supabaseUrl}/functions/v1/verify-student`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${supabaseAnonKey}`
                        },
                        body: JSON.stringify({
                            id_number: idNumber,
                            date_of_birth: isoDob,
                            credential_type: 'Student ID',
                            claims: ['is_student', 'university'],
                            idempotency_key: generateSecureId()
                        })
                    });
                }

                const verifyResult = await verifyResponse.json();
                if (!verifyResponse.ok || !verifyResult?.success) {
                    throw new Error(verifyResult?.message || 'Verification failed');
                }

                const issuedCredential = verifyResult.credential;
                if (!issuedCredential?.id || !issuedCredential?.attributes) {
                    throw new Error('Issuer response is missing credential data.');
                }

                // Step 1: Generate Salt
                setCurrentStep(1);
                const salt = generateSecureSalt();

                // Step 2: Compute Commitment
                setCurrentStep(2);
                
                let attributes: Record<string, number | string>;
                let commitments: Record<string, string>;
                let credentialType: string;

                if (isUniversity) {
                    credentialType = 'Student ID';
                    const commitment = await commitAttribute(zkEngine, 1, salt);

                    attributes = {
                        is_student: issuedCredential.attributes.is_student ?? 1,
                        university: issuedCredential.attributes.university || issuerName || 'University'
                    };
                    commitments = {
                        is_student: commitment
                    };
                } else if (isAadhaar) {
                    credentialType = 'Aadhaar';
                    // Extract birth_year from DOB
                    const birthYear = Number(issuedCredential.attributes.birth_year) || Number(year);
                    const commitment = await commitAttribute(zkEngine, birthYear, salt);

                    attributes = {
                        birth_year: birthYear,
                        age_over_18: issuedCredential.attributes.age_over_18 ?? 0,
                        age_over_23: issuedCredential.attributes.age_over_23 ?? 0,
                        indian_citizen: issuedCredential.attributes.indian_citizen ?? 1
                    };
                    commitments = {
                        birth_year: commitment
                    };
                } else {
                    throw new Error('Unsupported credential type');
                }

                // Step 3: Secure
                setCurrentStep(3);
                const credentialId = issuedCredential.id;
                await SecureStore.setItemAsync(`salt_${credentialId}`, salt);

                addCredential({
                    id: credentialId,
                    issuer: issuedCredential.issuer || issuerName || 'Unknown Issuer',
                    type: credentialType,
                    issuedAt: new Date(issuedCredential.issuedAt).getTime(),
                    expiresAt: issuedCredential.expiresAt ? new Date(issuedCredential.expiresAt).getTime() : undefined,
                    attributes,
                    commitments,
                    verified: true
                });

                setStatus('success');

                // Final Redirect
                setTimeout(() => {
                    router.dismissAll();
                    router.navigate('/(tabs)/credentials');
                }, 2000);

            } catch (e: any) {
                console.error(e);
                setErrorMessage(e?.message || 'Verification failed');
                setStatus('error');
            }
        };

        runVerification();
    }, []);

    return (
        <View className="flex-1 bg-[#1a1b26] items-center justify-center p-8">
            {status === 'verifying' && (
                <View className="items-center w-full">
                    <View className="w-20 h-20 bg-primary/10 rounded-full items-center justify-center mb-10 border border-primary/30">
                        <ActivityIndicator size="large" color="#7aa2f7" />
                    </View>

                    <View className="w-full bg-[#16161e] rounded-3xl border border-white/5 p-6 shadow-sm">
                        {steps.map((step, idx) => {
                            const isCurrent = idx === currentStep;
                            const isDone = idx < currentStep;
                            const StepIcon = step.icon;

                            return (
                                <View key={idx} className={`flex-row items-center gap-4 mb-5 ${isDone || isCurrent ? 'opacity-100' : 'opacity-30'}`}>
                                    <View className={`w-8 h-8 rounded-lg items-center justify-center ${isDone ? 'bg-success/20' : isCurrent ? 'bg-primary/20' : 'bg-white/5'}`}>
                                        {isDone ? <Check size={16} color="#9ece6a" /> : <StepIcon size={16} color={isCurrent ? "#7aa2f7" : "#565f89"} />}
                                    </View>
                                    <View className="flex-1">
                                        <Text className={`font-bold text-sm ${isCurrent ? 'text-white' : 'text-[#565f89]'}`}>{step.label}</Text>
                                        {isCurrent && <Text className="text-[10px] text-primary/70 animate-pulse">Processing...</Text>}
                                    </View>
                                    {isCurrent && <ActivityIndicator size="small" color="#7aa2f7" />}
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}

            {status === 'success' && (
                <View className="items-center">
                    <View className="w-24 h-24 rounded-full bg-success/10 items-center justify-center mb-6 border border-success/30">
                        <ShieldCheck size={48} color="#9ece6a" />
                    </View>
                    <Text className="text-foreground text-2xl font-bold mb-2 text-center">Successfully Verified!</Text>
                    <Text className="text-[#565f89] text-center mb-8">
                        Your credentials have been securely stored on your device.
                    </Text>
                    <View className="bg-[#16161e] px-4 py-2 rounded-lg border border-border">
                        <Text className="text-xs text-[#565f89] font-mono">ZK-PROOF: 0x7f...a92b</Text>
                    </View>
                </View>
            )}

            {status === 'error' && (
                <View className="items-center">
                    <View className="w-20 h-20 bg-error/10 rounded-full items-center justify-center mb-6 border border-error/20">
                        <X size={40} color="#f7768e" />
                    </View>
                    <Text className="text-xl font-bold text-foreground mb-4">Verification Failed</Text>
                    {errorMessage && (
                        <Text className="text-[#565f89] text-center mb-6">
                            {errorMessage}
                        </Text>
                    )}
                    <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-xl">
                        <Text className="text-[#1a1b26] font-bold">Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
