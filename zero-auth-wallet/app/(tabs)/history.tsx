import { useAuthStore, Session } from '@/store/auth-store';
import { Calendar, CheckCircle2, ShieldCheck, Fingerprint, Activity, StopCircle, History as HistoryIcon, Info } from 'lucide-react-native';
import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import CustomAlert from '@/components/CustomAlert';

const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
};

function SessionCard({ session, isActive }: { session: Session; isActive: boolean }) {
    const terminateSession = useAuthStore((state) => state.terminateSession);
    const [loading, setLoading] = useState(false);
    const [alertState, setAlertState] = useState<{
        visible: boolean;
        sessionName?: string;
    }>({ visible: false, sessionName: '' });

    const handleTerminate = () => {
        setAlertState({
            visible: true,
            sessionName: session.serviceName
        });
    };

    const confirmTerminate = async () => {
        setLoading(true);
        await terminateSession(session.id);
        setLoading(false);
        setAlertState({ visible: false, sessionName: '' });
    };

    return (
        <>
            <View className={`bg-card border ${isActive ? 'border-primary/20' : 'border-white/5'} p-5 rounded-3xl mb-4 shadow-sm relative overflow-hidden`}>
                {isActive && (
                    <View className="absolute top-0 right-0 left-0 h-1 bg-primary/20" />
                )}

                <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center gap-3">
                        <View className={`w-12 h-12 rounded-2xl ${isActive ? 'bg-primary/10 border-primary/20' : 'bg-success/5 border-success/10'} border items-center justify-center`}>
                            {isActive ? <Activity size={24} color="#7aa2f7" /> : <CheckCircle2 size={24} color="#9ece6a" />}
                        </View>
                        <View>
                            <Text className="text-foreground font-bold text-lg">{session.serviceName}</Text>
                            <Text className="text-[#565f89] text-[10px] font-mono" numberOfLines={1}>{session.verifierDid}</Text>
                        </View>
                    </View>
                    <View className={`${isActive ? 'bg-primary/20' : 'bg-[#1a1b26]'} px-2 py-1 rounded-full`}>
                        <Text className={`${isActive ? 'text-primary' : 'text-[#565f89]'} text-[8px] uppercase font-bold`}>
                            {isActive ? 'Active Now' : 'Expired'}
                        </Text>
                    </View>
                </View>

                <View className="mb-4">
                    <Text className="text-[#565f89] text-[10px] uppercase font-bold mb-2 tracking-widest">Shared Data</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {session.infoRequested.map((claim, idx) => (
                            <View key={idx} className="bg-primary/5 border border-primary/10 px-2 py-1 rounded-lg">
                                <Text className="text-primary text-[10px] font-medium">{claim.replace(/_/g, ' ')}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="flex-row justify-between items-center pt-4 border-t border-white/5">
                    <View className="flex-row items-center gap-1.5">
                        <Calendar size={12} color="#565f89" />
                        <Text className="text-[#565f89] text-xs font-medium">{formatDate(session.startTime)}</Text>
                    </View>

                    {isActive ? (
                        <TouchableOpacity
                            onPress={handleTerminate}
                            disabled={loading}
                            className="flex-row items-center gap-1 bg-error/10 px-3 py-1.5 rounded-lg border border-error/20"
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#f7768e" />
                            ) : (
                                <>
                                    <StopCircle size={14} color="#f7768e" />
                                    <Text className="text-error text-[11px] font-bold">Terminate</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View className="flex-row items-center gap-1">
                            <Fingerprint size={12} color="#9ece6a" />
                            <Text className="text-success text-[10px] font-bold">Securely Signed</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Custom Alert Modal */}
            <CustomAlert 
                visible={alertState.visible}
                title="Terminate Session?"
                message={`This will immediately revoke ${alertState.sessionName}'s access to your data.`}
                confirmText="Terminate"
                cancelText="Cancel"
                onConfirm={confirmTerminate}
                onCancel={() => setAlertState({ visible: false, sessionName: '' })}
                type="warning"
            />
        </>
    );
}

export default function HistoryScreen() {
    const { sessions, history } = useAuthStore();

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="flex-1 px-4">
                <View className="py-4 mb-2">
                    <Text className="text-primary font-bold text-sm tracking-wider uppercase">Privacy Monitor</Text>
                    <Text className="text-foreground text-2xl font-bold">Access & History</Text>
                </View>

                <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
                    {/* Active Sessions */}
                    {sessions.length > 0 && (
                        <View className="mb-8">
                            <View className="flex-row items-center gap-2 mb-4">
                                <Activity size={18} color="#7aa2f7" />
                                <Text className="text-foreground font-bold text-lg">Active Sessions</Text>
                                <View className="bg-primary/20 px-2 py-0.5 rounded-full">
                                    <Text className="text-primary text-[10px] font-bold">{sessions.length}</Text>
                                </View>
                            </View>
                            {sessions.map((session) => (
                                <SessionCard key={session.id} session={session} isActive={true} />
                            ))}
                        </View>
                    )}

                    {/* History */}
                    <View>
                        <View className="flex-row items-center gap-2 mb-4">
                            <HistoryIcon size={18} color="#565f89" />
                            <Text className="text-foreground font-bold text-lg">Past Activity</Text>
                        </View>

                        {history.length > 0 ? (
                            history.map((session) => (
                                <SessionCard key={session.id} session={session} isActive={false} />
                            ))
                        ) : (
                            <View className="bg-card/50 border border-border p-8 rounded-3xl items-center justify-center">
                                <Info size={24} color="#565f89" className="mb-2 opacity-50" />
                                <Text className="text-[#565f89] text-center italic text-sm">No past connections found</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
