import { useAuthStore } from '@/store/auth-store';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
    const router = useRouter();
    const { biometricsEnabled, toggleBiometrics } = useAuthStore();

    return (
        <SafeAreaView className="flex-1 bg-background">
            <View className="px-6 py-4 flex-row items-center gap-4">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-card">
                    <ChevronLeft size={24} color="#a9b1d6" />
                </TouchableOpacity>
                <Text className="text-white text-2xl font-bold">Settings</Text>
            </View>

            <View className="px-6 mt-8">
                <Text className="text-[#a9b1d6] font-bold text-xs tracking-widest uppercase opacity-70 mb-4">Security</Text>

                <View className="bg-card rounded-3xl p-5 flex-row items-center justify-between border border-white/5">
                    <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                            <Shield size={20} color="#7aa2f7" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-base">Biometric Auth</Text>
                            <Text className="text-muted-foreground text-xs">Require FaceID/Fingerprint before proving</Text>
                        </View>
                    </View>
                    <Switch
                        value={biometricsEnabled}
                        onValueChange={toggleBiometrics}
                        trackColor={{ false: '#24283b', true: '#7aa2f7' }}
                        thumbColor={biometricsEnabled ? '#ffffff' : '#565f89'}
                    />
                </View>

                <View className="mt-12 items-center opacity-30">
                    <Text className="text-white text-xs">Zero Auth Wallet v1.0.0</Text>
                    <Text className="text-white text-[10px] mt-1 italic">Privacy Reserved</Text>
                </View>
            </View>
        </SafeAreaView>
    );
}
