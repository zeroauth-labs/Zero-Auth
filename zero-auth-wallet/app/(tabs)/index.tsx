import NotificationModal from '@/components/NotificationModal';
import SessionCard from '@/components/SessionCard';
import { useAuthStore } from '@/store/auth-store';
import { useNetworkStatus } from '@/lib/offline';
import { useRouter } from 'expo-router';
import { Bell, QrCode, ShieldCheck, ShieldAlert, BadgeCheck, Shield, WifiOff } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DashboardScreen() {
  const router = useRouter();
  const sessions = useAuthStore((state) => state.sessions);
  const notifications = useAuthStore((state) => state.notifications);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Network status for offline support
  const { isOnline, queueCount } = useNetworkStatus();

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <NotificationModal visible={showNotifications} onClose={() => setShowNotifications(false)} />
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row justify-between items-center py-4 mb-3">
          <View>
            <Text className="text-[#a9b1d6] font-bold text-xs tracking-widest uppercase opacity-70">Secured with ZK</Text>
            <Text className="text-foreground text-3xl font-bold">Zero Auth</Text>
          </View>
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => router.push('/settings')} className="w-12 h-12 rounded-2xl bg-[#16161e] items-center justify-center border border-white/10 shadow-sm">
              <Shield size={22} color="#a9b1d6" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowNotifications(true)} className="w-12 h-12 rounded-2xl bg-[#16161e] items-center justify-center border border-white/10 shadow-sm">
              <Bell size={22} color="#a9b1d6" />
              {notifications.length > 0 && <View className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-error border-2 border-[#16161e]" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline Indicator */}
        {!isOnline && (
          <View className="bg-yellow-500/20 border border-yellow-500/30 px-4 py-2 rounded-2xl mb-4 flex-row items-center justify-center gap-2">
            <WifiOff size={16} color="#eab308" />
            <Text className="text-yellow-500 text-center text-sm font-medium">
              You're offline. Some features limited.
              {queueCount > 0 && ` ${queueCount} action${queueCount > 1 ? 's' : ''} queued.`}
            </Text>
          </View>
        )}

        {/* Security Health Card */}
        <View className="bg-card/50 border border-white/5 rounded-3xl p-5 mb-6 flex-row items-center gap-4">
          <View className="w-12 h-12 rounded-2xl bg-success/10 items-center justify-center border border-success/20">
            <ShieldCheck size={28} color="#9ece6a" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">System Secure</Text>
            <Text className="text-muted-foreground text-xs">Device-bound identity active</Text>
          </View>
          <View className="bg-success/20 px-3 py-1.5 rounded-full">
            <Text className="text-success text-[10px] font-bold uppercase">Healthy</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            onPress={() => router.push('/my-qr')}
            className="flex-1 bg-primary p-5 rounded-3xl items-center justify-center flex-row gap-3 active:opacity-90 shadow-xl shadow-primary/20"
          >
            <QrCode size={24} color="#1a1b26" />
            <Text className="text-[#1a1b26] font-bold text-lg">My Zero ID</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => isOnline ? router.push('/(tabs)/scanner') : null}
            disabled={!isOnline}
            className={`w-16 h-16 border rounded-3xl items-center justify-center ${
              isOnline 
                ? 'bg-[#16161e] border-white/10 active:bg-white/5' 
                : 'bg-[#16161e]/50 border-white/5 opacity-50'
            }`}
          >
            <BadgeCheck size={24} color={isOnline ? "#7aa2f7" : "#4a5568"} />
          </TouchableOpacity>
        </View>

        {/* Demo Seed Button - Only shown in development mode */}
        {__DEV__ && useAuthStore.getState().credentials.length === 0 && (
          <TouchableOpacity
            onPress={() => useAuthStore.getState().seedDemoData()}
            className="bg-success/10 border border-success/20 p-5 rounded-3xl items-center justify-center mb-8"
          >
            <Text className="text-success font-bold text-base mb-1">Testing Zero Auth?</Text>
            <Text className="text-success/70 text-xs">Tap to seed your vault with demo credentials</Text>
          </TouchableOpacity>
        )}

        <Text className="text-foreground text-lg font-bold mb-3">Active Sessions</Text>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7aa2f7" />
          }
        >
          {sessions.length > 0 ? (
            sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))
          ) : (
            <View className="items-center justify-center py-10 opacity-50">
              <Text className="text-foreground">No active sessions</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
