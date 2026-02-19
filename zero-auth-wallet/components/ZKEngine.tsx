import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { View } from 'react-native';
import { BridgeRequest, BridgeResponse, ZKProofPayload } from '../lib/zk-bridge-types';

interface ZKContextType {
  execute: (type: BridgeRequest['type'], payload: any) => Promise<any>;
  status: 'offline' | 'initializing' | 'ready' | 'proving' | 'error';
}

const ZKContext = createContext<ZKContextType | null>(null);

export const useZKEngine = () => {
  const context = useContext(ZKContext);
  if (!context) {
    throw new Error('useZKEngine must be used within a ZKProvider');
  }
  return context;
};

export const ZKProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const webViewRef = useRef<WebView>(null);
  const [status, setStatus] = useState<ZKContextType['status']>('initializing');
  const [injectedJS, setInjectedJS] = useState({ snarkjs: '', poseidon: '' });

  // Resolvers map: ID -> { resolve, reject }
  const resolvers = useRef<Record<string, { resolve: (val: any) => void; reject: (err: any) => void }>>({});

  // Load bundled assets
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const snarkjsAsset = Asset.fromModule(require('../assets/snarkjs.bundle'));
        const poseidonAsset = Asset.fromModule(require('../assets/poseidon.bundle'));

        await Promise.all([snarkjsAsset.downloadAsync(), poseidonAsset.downloadAsync()]);

        if (!snarkjsAsset.localUri || !poseidonAsset.localUri) {
          throw new Error("Failed to resolve local URIs for ZK assets");
        }

        const snarkjsContent = await FileSystem.readAsStringAsync(snarkjsAsset.localUri);
        const poseidonContent = await FileSystem.readAsStringAsync(poseidonAsset.localUri);

        console.log(`[ZKEngine] Asset sizes - SnarkJS: ${snarkjsContent.length}, Poseidon: ${poseidonContent.length}`);

        setInjectedJS({ snarkjs: snarkjsContent, poseidon: poseidonContent });
        setStatus('ready');
      } catch (e) {
        console.error("Failed to load ZK assets", e);
        setStatus('error');
      }
    };
    loadAssets();
  }, []);

  const execute = (type: BridgeRequest['type'], payload: any): Promise<any> => {
    if (type === 'GENERATE_PROOF') setStatus('proving');

    const id = Math.random().toString(36).substring(7);
    return new Promise((resolve, reject) => {
      // 45s timeout for heavy proofs
      const timeout = setTimeout(() => {
        delete resolvers.current[id];
        if (type === 'GENERATE_PROOF') setStatus('ready'); // Reset status on timeout
        reject(new Error('ZK Request Timed Out (45s)'));
      }, 45000);

      resolvers.current[id] = {
        resolve: (val) => {
          clearTimeout(timeout);
          if (type === 'GENERATE_PROOF') setStatus('ready');
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timeout);
          if (type === 'GENERATE_PROOF') setStatus('error');
          reject(err);
        }
      };

      const request: BridgeRequest = { id, type, payload } as BridgeRequest;

      console.log(`[ZKEngine v2] Request: ${type} (${id})`);
      if (status !== 'initializing' && status !== 'error' && webViewRef.current) {
        console.log(`[ZKEngine] Injecting execution call: ${id}`);
        // Bridge v7: Use direct script injection instead of postMessage for better Android reliability
        const script = `if (window.zkBridgeExecute) window.zkBridgeExecute(${JSON.stringify(request)}); true;`;
        webViewRef.current.injectJavaScript(script);
      } else {
        reject(new Error(`ZK Engine not ready (Status: ${status})`));
      }
    });
  };

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const response: BridgeResponse = JSON.parse(event.nativeEvent.data);

      // Handle Logs & Progress
      if (response.type === 'LOG') {
        console.log(`[ZK-WebView] ${response.payload}`);
        return;
      }

      const resolver = resolvers.current[response.id];
      if (!resolver) return;

      if (response.type === 'RESULT') {
        resolver.resolve(response.payload);
      } else if (response.type === 'ERROR') {
        resolver.reject(new Error(response.payload));
      }

      delete resolvers.current[response.id];
    } catch (err) {
      console.error('[ZKEngine] Failed to parse message:', err);
    }
  };

  /* New approach: Sequential Injection via injectJavaScript to avoid HTML size limits */
  const injectScripts = (webview: WebView) => {
    // 1. Inject Error Trapping & Console Forwarding
    webview.injectJavaScript(`
        window.onerror = function(message, source, lineno, colno, error) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'LOG', 
            payload: 'WebView Error: ' + message + ' at ' + lineno + ':' + colno
          }));
        };
        const oldLog = console.log;
        console.log = (...args) => {
           oldLog(...args);
           window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', payload: args.join(' ') }));
        };
        // SnarkJS expects process.nextTick and process.env
        window.process = { 
          env: { NODE_ENV: 'production' },
          nextTick: function(f) { setTimeout(f, 0); }
        };
        console.log("WebView Error Handlers & Polyfills Injected");
        true;
      `);

    // 2. Inject SnarkJS
    webview.injectJavaScript(`
        try {
            ${injectedJS.snarkjs}
            console.log("SnarkJS Injected. Type: " + typeof snarkjs);
        } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', payload: "SnarkJS Injection Failed: " + e }));
        }
        true;
      `);

    // 3. Inject Poseidon
    webview.injectJavaScript(`
        try {
            ${injectedJS.poseidon}
            console.log("Poseidon Injected. Type: " + typeof poseidon);
        } catch (e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'LOG', payload: "Poseidon Injection Failed: " + e }));
        }
        true;
      `);

    // 4. Inject Bridge Logic
    webview.injectJavaScript(`
        window.zkBridgeExecute = async (request) => {
             console.log("Bridge Executing: " + request.type + " (" + request.id + ")");
             try {
                 const { id, type, payload } = request;
                 
                 if (type === 'POSEIDON_HASH') {
                     // poseidon-lite exports named functions: poseidon1, poseidon2, etc.
                     // With globalName: 'poseidon', these are under window.poseidon
                     const inputs = payload.map((i) => BigInt(i));
                     const funcName = 'poseidon' + inputs.length;
                     const poseidonFunc = window.poseidon && window.poseidon[funcName];
                     
                     if (typeof poseidonFunc !== 'function') {
                         throw new Error('Poseidon function not found: ' + funcName + ' (Global type: ' + typeof window.poseidon + ')');
                     }
                     
                     const hash = poseidonFunc(inputs);
                     window.ReactNativeWebView.postMessage(JSON.stringify({
                       id, type: 'RESULT', payload: hash.toString()
                     }));
                 } else if (type === 'GENERATE_PROOF') {
                     if (typeof snarkjs === 'undefined') throw new Error('SnarkJS library not loaded');
                     const { inputs, wasmB64, zkeyB64 } = payload;
                     const wasm = Uint8Array.from(atob(wasmB64), c => c.charCodeAt(0));
                     const zkey = Uint8Array.from(atob(zkeyB64), c => c.charCodeAt(0));

                     console.log('Starting Groth16 Proof...');
                     const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasm, zkey);

                     window.ReactNativeWebView.postMessage(JSON.stringify({
                       id, type: 'RESULT', payload: { proof, publicSignals }
                     }));
                 }
             } catch (err) {
                 console.log("Processing Error: " + err.toString());
                 if (request && request.id) {
                     window.ReactNativeWebView.postMessage(JSON.stringify({
                         id: request.id, type: 'ERROR', payload: err.toString()
                     }));
                 }
             }
        };

        // Also keep message listener as fallback/legacy
        window.addEventListener('message', async (event) => {
             try {
                 const request = JSON.parse(event.data);
                 if (request && request.id) window.zkBridgeExecute(request);
             } catch(e) {}
        });
        
        // Final Ready Check
        setTimeout(() => {
             const snarkReady = typeof snarkjs !== 'undefined';
             const poseidonReady = typeof poseidon !== 'undefined';
             console.log("Check - SnarkJS: " + snarkReady + ", Poseidon: " + poseidonReady);
             if (snarkReady && poseidonReady) {
                 console.log("ZK Engine Fully Ready (v7)");
             } else {
                 console.log("ZK Engine Missing Libs (S:" + snarkReady + " P:" + poseidonReady + ")");
             }
        }, 500);
        true;
      `);
  };

  // Trigger injection once both WebView and assets are ready
  useEffect(() => {
    if (injectedJS.snarkjs && webViewRef.current && status === 'ready') {
      console.log('[ZKEngine] Assets & WebView ready, triggering injection');
      injectScripts(webViewRef.current);
    }
  }, [injectedJS, webViewRef.current, status]);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="background: transparent;"></body>
    </html>
  `;

  return (
    <ZKContext.Provider value={{ execute, status }}>
      {children}
      <View style={{ height: 0, width: 0, opacity: 0, position: 'absolute' }}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html }}
          onMessage={handleMessage}
          onLoad={() => {
            console.log('[ZKEngine] WebView Component onLoad');
            // We set status directly in loadAssets, so just checking for assets here
            if (injectedJS.snarkjs && webViewRef.current) {
              injectScripts(webViewRef.current);
            }
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    </ZKContext.Provider>
  );
};
