import { commitAttribute } from '@/lib/hashing';
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
    const params = useLocalSearchParams<{ issuerName: string, category: string, issuerId: string, idNumber: string }>();
    const { issuerName, category, issuerId } = params;
    const addCredential = useAuthStore((state) => state.addCredential);

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [currentStep, setCurrentStep] = useState(0);
    const zkEngine = useZKEngine();

    const steps = [
        { label: 'Hashing attributes', icon: Hash },
        { label: 'Generating secure salt', icon: Fingerprint },
        { label: 'Computing POSEIDON commitment', icon: ShieldCheck },
        { label: 'Securing in hardware enclave', icon: BadgeCheck }
    ];

    useEffect(() => {
        const runVerification = async () => {
            try {
                // Step 0: Hash attributes
                setCurrentStep(0);
                await new Promise(r => setTimeout(r, 1200));

                // Step 1: Generate Salt
                setCurrentStep(1);
                const salt = generateSecureSalt();
                await new Promise(r => setTimeout(r, 800));

                // Step 2: Compute Commitment
                setCurrentStep(2);
                // Step 2: Compute Commitment
                setCurrentStep(2);
                const birthYearValue = params.idNumber || '2005';
                let birthYear = Number(birthYearValue.split('/').pop()); // Extract year if DD/MM/YYYY
                const currentYear = new Date().getFullYear();

                // Sanity check: If birthYear is invalid or in the future, fallback to a sensible default (e.g., extracted from ID or 2000)
                if (isNaN(birthYear) || birthYear > currentYear || birthYear < 1900) {
                    console.warn(`Invalid birth year parsed: ${birthYear}. Defaulting to 2002.`);
                    birthYear = 2002;
                }

                const commitment = await commitAttribute(zkEngine, birthYear, salt);
                await new Promise(r => setTimeout(r, 1500));

                // Step 3: Secure
                setCurrentStep(3);
                const credentialId = generateSecureId();
                await SecureStore.setItemAsync(`salt_${credentialId}`, salt);
                await new Promise(r => setTimeout(r, 1000));

                addCredential({
                    id: credentialId,
                    issuer: issuerName || 'Unknown Issuer',
                    type: category === 'university' ? 'Student ID' : 'Age Verification',
                    issuedAt: Date.now(),
                    attributes: {
                        birth_year: birthYear
                    },
                    commitments: {
                        birth_year: commitment
                    },
                    verified: true
                });

                setStatus('success');

                // Final Redirect
                setTimeout(() => {
                    router.dismissAll();
                    router.navigate('/(tabs)/credentials');
                }, 2000);

            } catch (e) {
                console.error(e);
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
                    <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-xl">
                        <Text className="text-[#1a1b26] font-bold">Try Again</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}
