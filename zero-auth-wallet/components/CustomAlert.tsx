import { BlurView } from 'expo-blur';
import { AlertTriangle } from 'lucide-react-native';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function CustomAlert({ visible, title, message, confirmText, cancelText, onConfirm, onCancel }: CustomAlertProps) {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View className="flex-1 bg-black/60 justify-center items-center p-6">
                <View className="bg-[#1a1b26] w-full max-w-sm rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden">
                    <BlurView intensity={10} className="absolute inset-0" />

                    <View className="p-6 items-center">
                        <View className="w-12 h-12 rounded-full bg-red-500/10 items-center justify-center mb-4">
                            <AlertTriangle size={24} color="#ef4444" />
                        </View>
                        <Text className="text-white font-bold text-xl mb-2 text-center">{title}</Text>
                        <Text className="text-gray-400 text-center leading-5">{message}</Text>
                    </View>

                    <View className="flex-row border-t border-white/5">
                        <TouchableOpacity
                            onPress={onCancel}
                            className="flex-1 p-4 items-center justify-center border-r border-white/5 active:bg-white/5"
                        >
                            <Text className="text-gray-400 font-semibold">{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onConfirm}
                            className="flex-1 p-4 items-center justify-center active:bg-red-500/10"
                        >
                            <Text className="text-red-500 font-bold">{confirmText}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}
