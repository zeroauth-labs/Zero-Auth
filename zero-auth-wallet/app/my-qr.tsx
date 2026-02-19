import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'expo-router';
import { QrCode, ShieldCheck, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export default function MyQrModal() {
    const router = useRouter();
    const addSession = useAuthStore((state) => state.addSession);
    const [simulating, setSimulating] = useState(false);

    useEffect(() => {
        // Real session handling will go here later
    }, []);

    return (
        <View className="flex-1 bg-[#1a1b26] items-center justify-center p-6">
            <TouchableOpacity
                onPress={() => router.back()}
                className="absolute top-12 right-6 w-10 h-10 bg-card rounded-full items-center justify-center border border-border"
            >
                <X size={24} color="#a9b1d6" />
            </TouchableOpacity>

            <View className="bg-white p-6 rounded-3xl mb-8">
                <QrCode size={200} color="#000" />
            </View>

            <Text className="text-foreground text-2xl font-bold mb-2">My Zero ID</Text>
            <Text className="text-[#565f89] text-center mb-8">
                Scan this code at supported terminals to verify your identity without sharing your data.
            </Text>

            <View className="flex-row items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                <ShieldCheck size={20} color="#7aa2f7" />
                <Text className="text-primary font-medium">Zero-Knowledge Proof Ready</Text>
            </View>
        </View>
    );
}
