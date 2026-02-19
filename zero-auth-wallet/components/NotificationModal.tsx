import { BlurView } from 'expo-blur';
import { Bell, Trash2, X } from 'lucide-react-native';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useAuthStore } from '../store/auth-store';

interface NotificationModalProps {
    visible: boolean;
    onClose: () => void;
}

export default function NotificationModal({ visible, onClose }: NotificationModalProps) {
    const { notifications, clearNotifications } = useAuthStore();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-center items-center p-6">
                <View className="bg-[#1a1b26] w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                    <BlurView intensity={20} className="absolute inset-0" />

                    <View className="p-5 border-b border-white/5 flex-row justify-between items-center bg-[#16161e]/80">
                        <View className="flex-row items-center gap-3">
                            <View className="w-8 h-8 rounded-full bg-[#7aa2f7]/20 items-center justify-center">
                                <Bell size={16} color="#7aa2f7" />
                            </View>
                            <Text className="text-white font-bold text-lg">Notifications</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} className="w-8 h-8 items-center justify-center rounded-full bg-white/5 active:bg-white/10">
                            <X size={18} color="#a9b1d6" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="max-h-80 p-5">
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <View key={notif.id} className="mb-4 bg-[#1f202e] p-4 rounded-xl border border-white/5">
                                    <Text className="text-white font-bold mb-1">{notif.title}</Text>
                                    <Text className="text-gray-400 text-sm leading-5">{notif.message}</Text>
                                    <Text className="text-gray-600 text-xs mt-2 text-right">
                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <View className="py-10 items-center opacity-50">
                                <Text className="text-gray-500">No new notifications</Text>
                            </View>
                        )}
                    </ScrollView>

                    {notifications.length > 0 && (
                        <TouchableOpacity
                            onPress={clearNotifications}
                            className="p-4 border-t border-white/5 bg-[#16161e]/50 flex-row justify-center items-center gap-2 active:bg-red-500/10"
                        >
                            <Trash2 size={16} color="#ef4444" />
                            <Text className="text-red-400 font-medium">Clear All</Text>
                        </TouchableOpacity>
                    )}

                </View>
            </View>
        </Modal>
    );
}
