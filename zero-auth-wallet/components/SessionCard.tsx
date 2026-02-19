import { Clock, ShieldAlert, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Session, useAuthStore } from '../store/auth-store';

const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    return `${hours > 0 ? hours + ':' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export default function SessionCard({ session }: { session: Session }) {
    const terminateSession = useAuthStore((state) => state.terminateSession);
    const [duration, setDuration] = useState(Date.now() - session.startTime);

    useEffect(() => {
        const interval = setInterval(() => {
            setDuration(Date.now() - session.startTime);
        }, 1000);
        return () => clearInterval(interval);
    }, [session.startTime]);

    return (
        <View className="bg-card border border-border rounded-xl p-4 mb-3 shadow-lg">
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center gap-2">
                    {/* Placeholder Icon */}
                    <View className="w-10 h-10 rounded-full bg-secondary/20 items-center justify-center">
                        <ShieldAlert size={20} color="#bb9af7" />
                    </View>
                    <View>
                        <Text className="text-foreground font-bold text-lg">{session.serviceName}</Text>
                        <Text className="text-muted-foreground text-xs text-[#565f89]">{session.type}</Text>
                    </View>
                </View>
                <View className="bg-primary/20 px-2 py-1 rounded-md flex-row items-center gap-1">
                    <Clock size={12} color="#7aa2f7" />
                    <Text className="text-primary text-xs font-mono font-bold">{formatTime(duration)}</Text>
                </View>
            </View>

            <View className="mb-3">
                <Text className="text-[#565f89] text-xs uppercase font-bold mb-1">Data Shared:</Text>
                <View className="flex-row flex-wrap gap-2">
                    {session.infoRequested.map((info, index) => (
                        <View key={index} className="bg-background px-2 py-1 rounded border border-[#565f89]/30">
                            <Text className="text-[#a9b1d6] text-xs">{info}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                onPress={() => terminateSession(session.id)}
                className="flex-row items-center justify-center bg-error/10 py-2 rounded-lg border border-error/30 active:bg-error/20"
            >
                <Trash2 size={16} color="#f7768e" />
                <Text className="text-error font-medium ml-2">Revoke Access</Text>
            </TouchableOpacity>
        </View>
    );
}
