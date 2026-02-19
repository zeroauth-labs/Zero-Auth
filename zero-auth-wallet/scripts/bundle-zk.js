const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../assets');

// Ensure output directory exists
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function bundle() {
    console.log('📦 Bundling ZK dependencies...');

    try {
        // Bundle snarkjs
        await esbuild.build({
            entryPoints: [require.resolve('snarkjs')],
            outfile: path.join(OUT_DIR, 'snarkjs.bundle'),
            bundle: true,
            minify: true,
            format: 'iife',
            globalName: 'snarkjs',
            platform: 'browser',
            target: ['es2020'],
            define: {
                'process.env.NODE_ENV': '"production"',
                'global': 'window' // Browser context
            },
            alias: {
                'fs': path.resolve(__dirname, '../mocks/empty.js'),
                'os': path.resolve(__dirname, '../mocks/empty.js'),
                'crypto': path.resolve(__dirname, '../mocks/empty.js'),
                'path': path.resolve(__dirname, '../mocks/empty.js'),
                'readline': path.resolve(__dirname, '../mocks/empty.js'),
                'constants': path.resolve(__dirname, '../mocks/empty.js'),
                'child_process': path.resolve(__dirname, '../mocks/empty.js'),
                'assert': path.resolve(__dirname, '../mocks/empty.js'),
                'events': path.resolve(__dirname, '../mocks/empty.js'),
                'util': path.resolve(__dirname, '../mocks/empty.js'),
            }
        });
        console.log('✅ snarkjs.bundle created');

        // Bundle poseidon-lite
        await esbuild.build({
            entryPoints: [require.resolve('poseidon-lite')],
            outfile: path.join(OUT_DIR, 'poseidon.bundle'),
            bundle: true,
            minify: true,
            format: 'iife',
            globalName: 'poseidon',
            platform: 'browser',
            target: ['es2020']
        });
        console.log('✅ poseidon.bundle created');

    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

bundle();
