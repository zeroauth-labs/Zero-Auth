import { useZKEngine } from '@/components/ZKEngine';
import { commitAttribute } from '@/lib/hashing';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'expo-router';
import { ArrowLeft, ClipboardList, Info } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as SecureStore from 'expo-secure-store';
import { getRandomValues } from 'expo-crypto';

export default function ImportCredentialScreen() {
    const router = useRouter();
    const zkEngine = useZKEngine();
    const addCredential = useAuthStore((state) => state.addCredential);
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePaste = async () => {
        const text = await Clipboard.getStringAsync();
        setJsonInput(text);
    };

    const handleImport = async () => {
        try {
            setLoading(true);
            const data = JSON.parse(jsonInput);

            // Basic validation
            if (!data.issuer || !data.type || !data.attributes) {
                throw new Error("Invalid credential format. Missing issuer, type, or attributes.");
            }

            // Implementation of the hashing/commitment logic (same as verify.tsx)
            // 1. Generate Salt
            const saltBytes = new Uint8Array(32);
            getRandomValues(saltBytes);
            const salt = Buffer.from(saltBytes).toString('hex');

            // 2. Compute Commitment (assuming birth_year for now as that's what our circuit expects)
            const birthYear = data.attributes.birth_year || data.attributes.year_of_birth;
            if (!birthYear) {
                throw new Error("This demo requires a 'birth_year' attribute in the credential.");
            }

            const commitment = await commitAttribute(zkEngine, Number(birthYear), salt);

            // 3. Persist
            const credentialId = Math.random().toString(36).substring(7);
            await SecureStore.setItemAsync(`salt_${credentialId}`, salt);

            addCredential({
                id: credentialId,
                issuer: data.issuer,
                type: data.type,
                issuedAt: Date.now(),
                attributes: data.attributes,
                commitments: {
                    birth_year: commitment
                },
                verified: true
            });

            Alert.alert("Success", "Credential imported and secured.", [
                { text: "OK", onPress: () => router.dismissAll() }
            ]);

        } catch (e: any) {
            Alert.alert("Import Error", e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="px-4 py-4 flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-card rounded-full">
                        <ArrowLeft size={24} color="#a9b1d6" />
                    </TouchableOpacity>
                    <Text className="text-foreground text-xl font-bold">Import JSON</Text>
                </View>

                <ScrollView className="px-4 pt-4">
                    <View className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-6 flex-row gap-3">
                        <Info size={20} color="#7aa2f7" />
                        <Text className="text-primary/80 text-xs flex-1">
                            Paste a signed JSON credential payload. Your device will compute a local commitment to ensure privacy.
                        </Text>
                    </View>

                    <View className="mb-6">
                        <View className="flex-row justify-between items-end mb-2">
                            <Text className="text-foreground font-medium">JSON Payload</Text>
                            <TouchableOpacity onPress={handlePaste} className="flex-row items-center gap-1">
                                <ClipboardList size={14} color="#7aa2f7" />
                                <Text className="text-primary text-xs font-bold">Paste</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            multiline
                            numberOfLines={10}
                            className="bg-card border border-border rounded-xl p-4 text-[#a9b1d6] font-mono text-sm h-64"
                            textAlignVertical="top"
                            placeholder='{"issuer": "Gov", "attributes": {"birth_year": 1990}, ...}'
                            placeholderTextColor="#565f89"
                            value={jsonInput}
                            onChangeText={setJsonInput}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleImport}
                        disabled={!jsonInput || loading}
                        className={`p-4 rounded-xl items-center justify-center ${jsonInput && !loading ? 'bg-primary' : 'opacity-50 bg-[#16161e] border border-border'}`}
                    >
                        {loading ? (
                            <ActivityIndicator color="#1a1b26" />
                        ) : (
                            <Text className="text-[#1a1b26] font-bold text-lg">Process & Import</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
