const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Polyfills and Extra Modules
config.resolver.extraNodeModules = {
    ...require('node-libs-react-native'),
    'crypto': require.resolve('expo-crypto'),
    'buffer': require.resolve('buffer/'),
    'process': require.resolve('process/browser'),
    'events': require.resolve('events/'),
    'path': require.resolve('path-browserify'),
    'stream': require.resolve('stream-browserify'),
};

// Asset extensions for ZK artifacts
config.resolver.assetExts.push('wasm', 'zkey', 'bundle');
config.resolver.sourceExts = config.resolver.sourceExts.filter(ext => ext !== 'bundle');

// Robust Mocks using resolveRequest
// Intercept Node.js built-ins that snarkjs incorrectly assumes are available
const MOCKED_MODULES = [
    'web-worker',
    'worker_threads',
    'readline',
    'fs',
    'child_process',
    'os'
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (MOCKED_MODULES.includes(moduleName)) {
        return {
            type: 'sourceFile',
            filePath: path.resolve(__dirname, 'mocks/empty.js'),
        };
    }
    // Fallback to default resolver
    return context.resolveRequest(context, moduleName, platform);
};

// Enable package exports for better compatibility with libraries like snarkjs
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: './global.css' });
