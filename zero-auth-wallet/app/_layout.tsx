import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import 'react-native-reanimated';
import '../global.css';
// Polyfill for crypto
import { useAuthStore } from '@/store/auth-store';
import { useWalletStore } from '@/store/wallet-store';
import { getRandomValues } from 'expo-crypto';
import { parseVerificationQR } from '@/lib/qr-protocol';
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

  // Handle deep links - zeroauth://verify?session=xxx
  useEffect(() => {
    if (!isReady || isLoading || !hasHydrated || !isInitialized) return;

    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log('[DeepLink] Received URL:', url);
      
      // Parse the URL: zeroauth://verify?session=xxx
      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol === 'zeroauth:' && parsedUrl.hostname === 'verify') {
          const sessionId = parsedUrl.searchParams.get('session');
          if (sessionId) {
            console.log('[DeepLink] Session ID:', sessionId);
            // Fetch session from relay and navigate to approve screen
            // For now, we need to fetch the session details from the relay
            fetchSessionAndNavigate(sessionId);
          }
        }
      } catch (e) {
        console.error('[DeepLink] Failed to parse URL:', e);
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isReady, isLoading, hasHydrated]);

  // Function to fetch session and navigate
  const fetchSessionAndNavigate = async (sessionId: string) => {
    try {
      const relayUrl = 'https://zeroauth-relay.onrender.com';
      const response = await fetch(`${relayUrl}/api/v1/sessions/${sessionId}`);
      
      if (!response.ok) {
        console.error('[DeepLink] Failed to fetch session:', response.status);
        return;
      }
      
      const session = await response.json();
      console.log('[DeepLink] Session data:', session);
      
      // Build the verification request from session
      const verificationRequest = {
        v: 1,
        action: 'verify',
        session_id: session.session_id,
        nonce: session.nonce,
        verifier: {
          did: session.verifier_did || 'did:web:zeroauth.verifier',
          name: session.verifier_name || 'ZeroAuth Verifier',
          callback: `${relayUrl}/api/v1/sessions/${session.session_id}/proof`
        },
        required_claims: typeof session.required_claims === 'string' 
          ? JSON.parse(session.required_claims) 
          : session.required_claims || [],
        credential_type: session.credential_type || 'Age Verification',
        expires_at: Math.floor(new Date(session.expires_at).getTime() / 1000)
      };
      
      // Navigate to approve screen
      router.push({
        pathname: '/approve-request',
        params: { request: JSON.stringify(verificationRequest) }
      });
    } catch (e) {
      console.error('[DeepLink] Error fetching session:', e);
    }
  };

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
          <Stack.Screen name="approve-request" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </View>
    </ZKProvider>
  );
}
