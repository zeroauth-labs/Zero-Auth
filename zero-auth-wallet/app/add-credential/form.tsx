import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CredentialForm() {
    const router = useRouter();
    const { issuerName, category, issuerId } = useLocalSearchParams<{ issuerName: string, category: string, issuerId: string }>();

    const [idNumber, setIdNumber] = useState('');
    const [dob, setDob] = useState('');

    const handleDobChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        let formatted = cleaned;
        if (cleaned.length > 2) {
            formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
        }
        if (cleaned.length > 4) {
            formatted = formatted.slice(0, 5) + '/' + cleaned.slice(4, 8);
        }
        setDob(formatted.slice(0, 10));
    };

    const canSubmit = idNumber.length > 3 && dob.length === 10;

    const handleSubmit = () => {
        router.push({
            pathname: '/add-credential/verify',
            params: { issuerName, category, issuerId, idNumber }
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="px-4 py-4 flex-row items-center gap-4">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-card rounded-full">
                        <ArrowLeft size={24} color="#a9b1d6" />
                    </TouchableOpacity>
                    <Text className="text-foreground text-xl font-bold">Verify Identity</Text>
                </View>

                <ScrollView className="px-4 pt-4">
                    <Text className="text-[#565f89] uppercase text-xs font-bold tracking-widest mb-6">
                        {issuerName}
                    </Text>

                    <View className="mb-6">
                        <Text className="text-foreground font-medium mb-2">
                            {category === 'university' ? 'Registration Number' : 'Document Number'}
                        </Text>
                        <TextInput
                            className="bg-card border border-border rounded-xl p-4 text-foreground text-lg placeholder:text-muted-foreground"
                            placeholder={category === 'university' ? 'e.g. TVA19CS001' : 'e.g. 1234 5678 9012'}
                            placeholderTextColor="#565f89"
                            value={idNumber}
                            onChangeText={setIdNumber}
                            autoCapitalize="characters"
                        />
                    </View>

                    <View className="mb-8">
                        <Text className="text-foreground font-medium mb-2">Date of Birth</Text>
                        <TextInput
                            className="bg-card border border-border rounded-xl p-4 text-foreground text-lg placeholder:text-muted-foreground"
                            placeholder="DD/MM/YYYY"
                            placeholderTextColor="#565f89"
                            value={dob}
                            onChangeText={handleDobChange}
                            keyboardType="numeric"
                            maxLength={10}
                        />
                    </View>

                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={!canSubmit}
                        className={`p-4 rounded-xl items-center justify-center ${canSubmit ? 'bg-primary' : 'bg-[#16161e] border border-border'}`}
                    >
                        <Text className={canSubmit ? 'text-[#1a1b26] font-bold text-lg' : 'text-[#565f89] font-bold text-lg'}>
                            Verify & Add
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
