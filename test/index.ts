import * as esbuild from 'esbuild';
import ImportPlugin from '../src/index'

esbuild.build({
  entryPoints: ['./test/app.tsx'],
  outfile: './dist/index.js',
  bundle: true,
  plugins: [ImportPlugin({
    libraryName: 'antd',
    style: 'css'
  })],
  target: 'es2020',
  format: 'esm',
  define: {
    "process.env.NODE_ENV": '"production"'
  },
  external: ['react', 'react-dom'],
  treeShaking: true
}).then(result => {
}).catch(() => process.exit(1))
