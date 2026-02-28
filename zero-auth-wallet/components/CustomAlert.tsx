import { BlurView } from 'expo-blur';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react-native';
import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'error' | 'success' | 'warning' | 'info';
}

export default function CustomAlert({ 
    visible, 
    title, 
    message, 
    confirmText, 
    cancelText, 
    onConfirm, 
    onCancel,
    type = 'info' 
}: CustomAlertProps) {
    // Determine colors based on type
    const getColors = () => {
        switch (type) {
            case 'error':
                return { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '#ef4444', text: '#ef4444' };
            case 'success':
                return { bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '#4ade80', text: '#4ade80' };
            case 'warning':
                return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '#fbbf24', text: '#fbbf24' };
            default:
                return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '#60a5fa', text: '#60a5fa' };
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'error':
                return <XCircle size={24} color={getColors().icon} />;
            case 'success':
                return <CheckCircle size={24} color={getColors().icon} />;
            case 'warning':
                return <AlertTriangle size={24} color={getColors().icon} />;
            default:
                return <Info size={24} color={getColors().icon} />;
        }
    };

    const colors = getColors();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel}
        >
            <View className="flex-1 bg-black/60 justify-center items-center p-6">
                <View className={`bg-[#1a1b26] w-full max-w-sm rounded-2xl border ${colors.border} shadow-2xl overflow-hidden`}>
                    <BlurView intensity={10} className="absolute inset-0" />

                    <View className="p-6 items-center">
                        <View className={`w-12 h-12 rounded-full ${colors.bg} items-center justify-center mb-4`}>
                            {getIcon()}
                        </View>
                        <Text className="text-white font-bold text-xl mb-2 text-center">{title}</Text>
                        <Text className="text-gray-400 text-center leading-5">{message}</Text>
                    </View>

                    <View className="flex-row border-t border-white/5">
                        {cancelText && (
                            <TouchableOpacity
                                onPress={onCancel}
                                className="flex-1 p-4 items-center justify-center border-r border-white/5 active:bg-white/5"
                            >
                                <Text className="text-gray-400 font-semibold">{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={onConfirm}
                            className={`flex-1 p-4 items-center justify-center ${cancelText ? '' : 'flex'}`}
                        >
                            <Text className={`font-bold ${type === 'error' ? 'text-red-500' : 'text-blue-400'}`}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
        </Modal>
    );
}
