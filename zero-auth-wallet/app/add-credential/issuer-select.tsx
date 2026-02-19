import { useAuthStore } from '@/store/auth-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ISSUERS = {
    university: [
        { id: 'ktu', name: 'APJ Abdul Kalam Technological University (KTU)' },
        { id: 'mumbai', name: 'University of Mumbai' },
        { id: 'iit_bombay', name: 'IIT Bombay' },
        { id: 'delhi', name: 'Delhi University' },
        { id: 'anna', name: 'Anna University' },
    ],
    government: [
        { id: 'aadhaar', name: 'Aadhaar (UIDAI)' },
        { id: 'passport', name: 'Indian Passport' },
        { id: 'dl', name: 'Driving License' },
    ]
};

export default function IssuerSelectScreen() {
    const router = useRouter();
    const { category } = useLocalSearchParams<{ category: string }>();
    const credentials = useAuthStore((state) => state.credentials);

    // LOGIC: Check if user already has a University ID
    const hasUniversityId = credentials.some(c => c.type === 'Student ID');

    const handleSelect = (issuer: any) => {
        if (category === 'university' && hasUniversityId) {
            Alert.alert(
                "Limit Reached",
                "You can only hold one active University ID. Please revoke your existing ID to add a new one.",
                [{ text: "OK" }]
            );
            return;
        }

        router.push({
            pathname: '/add-credential/form',
            params: { issuerId: issuer.id, issuerName: issuer.name, category }
        });
    };

    const list = ISSUERS[category as keyof typeof ISSUERS] || [];

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-4 py-4 flex-row items-center gap-4">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-card rounded-full">
                    <ArrowLeft size={24} color="#a9b1d6" />
                </TouchableOpacity>
                <Text className="text-foreground text-xl font-bold">Select Issuer</Text>
            </View>

            <ScrollView className="px-4 pt-4">
                {list.map((issuer) => (
                    <TouchableOpacity
                        key={issuer.id}
                        onPress={() => handleSelect(issuer)}
                        className="bg-card border border-border p-4 rounded-xl mb-3 flex-row items-center justify-between active:bg-card/80"
                    >
                        <Text className="text-foreground font-medium flex-1">{issuer.name}</Text>
                        <ChevronRight size={20} color="#565f89" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
