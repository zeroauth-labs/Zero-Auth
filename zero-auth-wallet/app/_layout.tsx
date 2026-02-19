import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';
import '../global.css';
// Polyfill for crypto
import { useAuthStore } from '@/store/auth-store';
import { useWalletStore } from '@/store/wallet-store';
import { getRandomValues } from 'expo-crypto';
// import 'react-native-get-random-values'; // DISABLED

if (!global.crypto) {
  // @ts-ignore
  global.crypto = {};
}
// @ts-ignore
if (!global.crypto.getRandomValues) {
  // @ts-ignore
  global.crypto.getRandomValues = getRandomValues;
}

// Polyfill for TextEncoder (required by @stablelib/base64 and ed25519)
import { TextDecoder, TextEncoder } from 'text-encoding';
if (!global.TextEncoder) {
  // @ts-ignore
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  // @ts-ignore
  global.TextDecoder = TextDecoder;
}

// Polyfill for Blob (Fixes snarkjs/ffjavascript issues)
if (typeof Blob === 'undefined') {
  // @ts-ignore
  global.Blob = require('buffer').Blob;
} else {
  const NativeBlob = global.Blob;
  // @ts-ignore
  global.Blob = function (parts, options) {
    // If parts contain ArrayBuffer or View, use the buffer-based Blob which is more compatible if available
    if (parts && parts.some((p: any) => p instanceof ArrayBuffer || ArrayBuffer.isView(p))) {
      const BufferBlob = require('buffer').Blob;
      if (BufferBlob) {
        return new BufferBlob(parts, options);
      }
    }
    return new NativeBlob(parts, options);
  };
  // @ts-ignore
  global.Blob.prototype = NativeBlob.prototype;
}

// Polyfill for Buffer
import { Buffer } from 'buffer';
if (!global.Buffer) {
  // @ts-ignore
  global.Buffer = Buffer;
}

// Polyfill for process
if (!global.process) {
  // @ts-ignore
  global.process = require('process');
} else {
  // @ts-ignore
  global.process.env = global.process.env || {};
  // @ts-ignore
  global.process.browser = true;
}

SplashScreen.preventAutoHideAsync();

import { ZKProvider } from '@/components/ZKEngine';

export default function RootLayout() {
  const checkInitialization = useWalletStore((state) => state.checkInitialization);
  const isInitialized = useWalletStore((state) => state.isInitialized);
  const isLoading = useWalletStore((state) => state.isLoading);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync();
    checkInitialization().then(() => setIsReady(true));
  }, []);

  useEffect(() => {
    if (!isReady || isLoading || !hasHydrated) return;

    if (!isInitialized) {
      router.replace('/onboarding');
    }
  }, [isReady, isLoading, isInitialized, hasHydrated]);

  if (!isReady || !hasHydrated) {
    return null;
  }

  return (
    <ZKProvider>
      <View className="flex-1 bg-[#1a1b26]">
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </View>
    </ZKProvider>
  );
}
