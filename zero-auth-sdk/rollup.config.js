import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: 'dist/zero-auth-sdk.umd.js',
      format: 'umd',
      name: 'ZeroAuth',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM'
      }
    }
  ],
  external: ['react', 'react-dom'],
  plugins: [
    resolve({
      preferBuiltins: false,
      browser: true
    }),
    commonjs({
      include: /node_modules\/qrcode/
    }),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false
    })
  ]
};
