import { parseVerificationQR } from '@/lib/qr-protocol';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { ScanLine, X } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '@/components/CustomAlert';

export default function ScannerScreen() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [alertState, setAlertState] = useState<{
        visible: boolean;
        type: 'error' | 'success' | 'warning' | 'info';
        title: string;
        message: string;
    }>({ visible: false, type: 'info', title: '', message: '' });

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        setScanned(true);
        const request = parseVerificationQR(data);

        if (request) {
            router.push({
                pathname: '/approve-request',
                params: { request: JSON.stringify(request) }
            });
            // Reset scan state after a delay or when coming back
            setTimeout(() => setScanned(false), 2000);
        } else {
            setAlertState({
                visible: true,
                type: 'error',
                title: 'Invalid QR Code',
                message: 'This code is not a valid Zero Auth verification request.',
            });
        }
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View className="flex-1 bg-black" />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <SafeAreaView className="flex-1 bg-[#1a1b26] items-center justify-center p-6">
                <Text className="text-white text-center mb-4 text-lg">We need your permission to show the camera</Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    className="bg-primary px-6 py-3 rounded-xl"
                >
                    <Text className="text-[#1a1b26] font-bold">Grant Permission</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <CameraView
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            >
                <SafeAreaView className="flex-1">
                    {/* Overlay UI */}
                    <View className="flex-1 justify-between p-6">
                        <View className="flex-row justify-between items-center mt-4">
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
                            >
                                <X size={20} color="white" />
                            </TouchableOpacity>
                            <View className="bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">
                                <Text className="text-white font-medium">Scan QR Code</Text>
                            </View>
                            <View className="w-10" />
                        </View>

                        {/* Scanner Marker */}
                        <View className="items-center justify-center flex-1">
                            <View className="w-64 h-64 border-2 border-primary rounded-3xl items-center justify-center relative">
                                <View className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary -mt-1 -ml-1 rounded-tl-xl" />
                                <View className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary -mt-1 -mr-1 rounded-tr-xl" />
                                <View className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary -mb-1 -ml-1 rounded-bl-xl" />
                                <View className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary -mb-1 -mr-1 rounded-br-xl" />

                                <ScanLine size={48} color="#7aa2f7" className="animate-pulse opacity-50" />
                            </View>
                            <Text className="text-white/70 mt-8 text-center text-sm bg-black/40 px-4 py-2 rounded-full">
                                Align code within frame
                            </Text>
                        </View>

                        <View className="h-24" />
                    </View>
                </SafeAreaView>
            </CameraView>

            {/* Custom Alert Modal */}
            <CustomAlert 
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                confirmText="OK"
                cancelText=""
                onConfirm={() => {
                    setAlertState(prev => ({ ...prev, visible: false }));
                    setScanned(false);
                }}
                onCancel={() => setAlertState(prev => ({ ...prev, visible: false }))}
                type={alertState.type}
            />
        </View>
    );
}
