import { useWalletStore } from '@/store/wallet-store';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'expo-router';
import { Info, RefreshCw, Smartphone, Trash2, Calendar } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as LocalAuthentication from 'expo-local-authentication';
import { Copy, ShieldCheck, ShieldX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import CustomAlert from '@/components/CustomAlert';

export default function SettingsScreen() {
    const did = useWalletStore((state) => state.did);
    const publicKeyHex = useWalletStore((state) => state.publicKeyHex);
    const [biometricStatus, setBiometricStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');
    const resetWallet = useWalletStore((state) => state.resetWallet);
    const clearAllData = useAuthStore((state) => state.clearAllData);
    const clearHistory = useAuthStore((state) => state.clearHistory);
    const router = useRouter();

    // Alert state
    const [alertState, setAlertState] = useState<{
        visible: boolean;
        type: 'error' | 'success' | 'warning' | 'info';
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        onConfirm?: () => void;
    }>({ visible: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        LocalAuthentication.hasHardwareAsync().then(hasHardware => {
            setBiometricStatus(hasHardware ? 'available' : 'unavailable');
        });
    }, []);

    const handleReset = () => {
        setAlertState({
            visible: true,
            type: 'warning',
            title: 'Reset Wallet',
            message: 'This will delete your identity, credentials, and all data. This action cannot be undone.',
            confirmText: 'Delete & Reset',
            cancelText: 'Cancel',
            onConfirm: async () => {
                setAlertState(prev => ({ ...prev, visible: false }));
                await resetWallet();
                await clearAllData();
                router.replace('/onboarding');
            }
        });
    };

    const handleCopyDID = async () => {
        await Clipboard.setStringAsync(did || '');
        setAlertState({
            visible: true,
            type: 'success',
            title: 'Copied',
            message: 'DID copied to clipboard',
        });
    };

    const handleCopyPublicKey = async () => {
        await Clipboard.setStringAsync(publicKeyHex || '');
        setAlertState({
            visible: true,
            type: 'success',
            title: 'Copied',
            message: 'Public Key copied to clipboard',
        });
    };

    const handleViewSecretKey = async () => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();

        if (hasHardware && isEnrolled) {
            const auth = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to view Secret Key',
            });
            if (!auth.success) return;
        }

        const pk = await useWalletStore.getState().getRawPrivateKey();
        if (pk) {
            setAlertState({
                visible: true,
                type: 'info',
                title: 'Secret Key',
                message: pk,
                confirmText: 'Copy',
                onConfirm: async () => {
                    await Clipboard.setStringAsync(pk);
                    setAlertState(prev => ({ ...prev, visible: false }));
                }
            });
        } else {
            setAlertState({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Could not retrieve key',
            });
        }
    };

    const handleClearHistory = () => {
        setAlertState({
            visible: true,
            type: 'warning',
            title: 'Clear History',
            message: 'Are you sure you want to clear your verification history?',
            confirmText: 'Clear',
            cancelText: 'Cancel',
            onConfirm: () => {
                setAlertState(prev => ({ ...prev, visible: false }));
                clearHistory();
            }
        });
    };

    const handleReload = () => {
        router.replace('/');
    };

    return (
        <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <View className="px-6 py-6 border-b border-white/5">
                <Text className="text-foreground text-3xl font-bold">Settings</Text>
                <Text className="text-muted-foreground">Manage your device identity</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">

                {/* Identity Card */}
                <View className="bg-card p-5 rounded-2xl border border-primary/20 shadow-sm mb-6">
                    <View className="flex-row items-center gap-2 mb-4">
                        <Smartphone size={20} color="#7aa2f7" />
                        <Text className="font-bold text-foreground text-lg">Device Identity</Text>
                    </View>

                    <View className="mb-4">
                        <View className="flex-row justify-between items-end mb-1">
                            <Text className="text-xs font-bold text-muted-foreground uppercase">DID (Decentralized ID)</Text>
                            <TouchableOpacity onPress={handleCopyDID}>
                                <Copy size={12} color="#7aa2f7" />
                            </TouchableOpacity>
                        </View>
                        <Text className="font-mono text-xs text-[#7aa2f7] bg-black/20 p-2 rounded border border-white/5">
                            {did || 'Not initialized'}
                        </Text>
                    </View>

                    <View>
                        <View className="flex-row justify-between items-end mb-1">
                            <Text className="text-xs font-bold text-muted-foreground uppercase">Public Key Fingerprint</Text>
                            <TouchableOpacity onPress={handleCopyPublicKey}>
                                <Copy size={12} color="#7aa2f7" />
                            </TouchableOpacity>
                        </View>
                        <Text className="font-mono text-xs text-[#7aa2f7] bg-black/20 p-2 rounded border border-white/5" numberOfLines={1} ellipsizeMode="middle">
                            {publicKeyHex || 'Loading...'}
                        </Text>
                    </View>

                    <View className="mt-4 pt-4 border-t border-white/5">
                        <Text className="text-xs font-bold text-muted-foreground uppercase mb-1">Security Hardware</Text>
                        <View className="flex-row items-center gap-2 bg-black/20 p-2 rounded border border-white/5">
                            {biometricStatus === 'available' ? (
                                <>
                                    <ShieldCheck size={14} color="#9ece6a" />
                                    <Text className="text-success text-xs font-bold">Biometrics Supported</Text>
                                </>
                            ) : biometricStatus === 'unavailable' ? (
                                <>
                                    <ShieldX size={14} color="#f7768e" />
                                    <Text className="text-error text-xs font-bold">Biometrics Unavailable</Text>
                                </>
                            ) : (
                                <Text className="text-muted-foreground text-xs">Checking...</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Secret Key Backup */}
                <Text className="text-sm font-bold text-muted-foreground uppercase mb-3 px-1">Security</Text>

                <TouchableOpacity
                    onPress={handleViewSecretKey}
                    className="bg-card p-4 rounded-xl border border-white/5 flex-row items-center gap-4 mb-6 active:bg-white/5"
                >
                    <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                        <ShieldCheck size={20} color="#7aa2f7" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-foreground font-bold">Backup Identity</Text>
                        <Text className="text-muted-foreground text-xs">View Secret Recovery Key</Text>
                    </View>
                </TouchableOpacity>

                {/* Actions */}
                <Text className="text-sm font-bold text-muted-foreground uppercase mb-3 px-1">Actions</Text>

                <TouchableOpacity
                    onPress={handleReset}
                    className="bg-card p-4 rounded-xl border border-error/20 flex-row items-center gap-4 mb-3 active:bg-error/10"
                >
                    <View className="w-10 h-10 bg-error/10 rounded-full items-center justify-center">
                        <Trash2 size={20} color="#f7768e" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-foreground font-bold">Reset Wallet</Text>
                        <Text className="text-muted-foreground text-xs">Wipe keys and start fresh</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleClearHistory}
                    className="bg-card p-4 rounded-xl border border-white/5 flex-row items-center gap-4 mb-3 active:bg-white/5"
                >
                    <View className="w-10 h-10 bg-muted/10 rounded-full items-center justify-center">
                        <Calendar size={20} color="#565f89" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-foreground font-bold">Clear History</Text>
                        <Text className="text-muted-foreground text-xs">Delete all past verification logs</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleReload}
                    className="bg-card p-4 rounded-xl border border-primary/20 flex-row items-center gap-4 active:bg-primary/10"
                >
                    <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                        <RefreshCw size={20} color="#7aa2f7" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-foreground font-bold">Reload App</Text>
                        <Text className="text-muted-foreground text-xs">Refresh wallet state</Text>
                    </View>
                </TouchableOpacity>

            </ScrollView>

            {/* Footer */}
            <View className="p-6 items-center">
                <View className="flex-row items-center gap-2 mb-1">
                    <Info size={14} color="#94a3b8" />
                    <Text className="text-slate-400 font-bold">Zero Auth Wallet</Text>
                </View>
                <Text className="text-slate-500 text-xs">Version 1.2.000</Text>
            </View>

            {/* Custom Alert Modal */}
            <CustomAlert 
                visible={alertState.visible}
                title={alertState.title}
                message={alertState.message}
                confirmText={alertState.confirmText || 'OK'}
                cancelText={alertState.cancelText || ''}
                onConfirm={() => {
                    if (alertState.onConfirm) {
                        alertState.onConfirm();
                    } else {
                        setAlertState(prev => ({ ...prev, visible: false }));
                    }
                }}
                onCancel={() => setAlertState(prev => ({ ...prev, visible: false }))}
                type={alertState.type}
            />
        </SafeAreaView>
    );
}
