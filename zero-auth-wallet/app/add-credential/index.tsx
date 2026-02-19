import { useRouter } from 'expo-router';
import { ArrowRight, GraduationCap, Landmark, X } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
    {
        id: 'university',
        title: 'University ID',
        description: 'Verify your student status, graduation year, and department.',
        icon: GraduationCap,
        color: '#7aa2f7',
    },
    {
        id: 'government',
        title: 'Government ID',
        description: 'Aadhaar, Passport, Driving License, etc.',
        icon: Landmark,
        color: '#bb9af7',
    },
];

const ADVANCED = [
    {
        id: 'import',
        title: 'Import JSON',
        description: 'Import a signed JSON/JWT credential from clipboard.',
        icon: ClipboardList,
        color: '#9ece6a',
        pathname: '/add-credential/import'
    }
];

import { ClipboardList, FileJson } from 'lucide-react-native';

export default function AddCredentialIndex() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-4 py-4 flex-row items-center justify-between">
                <Text className="text-foreground text-2xl font-bold">Add Credential</Text>
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-card rounded-full">
                    <X size={24} color="#a9b1d6" />
                </TouchableOpacity>
            </View>

            <Text className="px-4 text-[#565f89] mb-6">Select a category to start verification</Text>

            <ScrollView className="px-4">
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        onPress={() => router.push({ pathname: '/add-credential/issuer-select', params: { category: cat.id } })}
                        className="bg-card border border-border p-5 rounded-2xl mb-4 flex-row items-center gap-4 active:bg-card/80"
                    >
                        <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                            <cat.icon size={24} color={cat.color} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-foreground font-bold text-lg mb-1">{cat.title}</Text>
                            <Text className="text-[#565f89] text-xs leading-5">{cat.description}</Text>
                        </View>
                        <ArrowRight size={20} color="#565f89" />
                    </TouchableOpacity>
                ))}

                <Text className="text-[#565f89] uppercase text-xs font-bold tracking-widest mt-4 mb-4">Advanced</Text>
                {ADVANCED.map((cat) => (
                    <TouchableOpacity
                        key={cat.id}
                        onPress={() => router.push(cat.pathname as any)}
                        className="bg-card border border-border p-5 rounded-2xl mb-4 flex-row items-center gap-4 active:bg-card/80"
                    >
                        <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                            <cat.icon size={24} color={cat.color} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-foreground font-bold text-lg mb-1">{cat.title}</Text>
                            <Text className="text-[#565f89] text-xs leading-5">{cat.description}</Text>
                        </View>
                        <ArrowRight size={20} color="#565f89" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
