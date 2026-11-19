import 'dotenv/config'
import restart from 'vite-plugin-restart'
import wasm from 'vite-plugin-wasm'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default {
    root: 'sources/', // Sources files (typically where index.html is)
    envDir: '../',  // Directory where the env file is located
    publicDir: '../static/', // Path from "root" to static assets (files that are served as they are)
    base: './', // Public path (what's after the domain)
    resolve:
    {
        // three/examples import 'three': point them at the WebGPU build so Three.js is bundled once
        alias: [ { find: /^three$/, replacement: 'three/webgpu' } ]
    },
    server:
    {
        // https: true,
        host: true, // Open to local network and display URL
        open: true // Open in browser
    },
    build:
    {
        outDir: '../dist', // Output in the dist/ folder
        emptyOutDir: true, // Empty the folder first
        sourcemap: false // Add sourcemap
    },
    plugins:
    [
        wasm(),
        restart({ restart: [ '../static/**', ] }), // Restart server on static file change
        nodePolyfills({ include: [ 'buffer' ], globals: { Buffer: true, global: true, process: false } }), // only Buffer (msgpack-lite)
        // basicSsl()
    ]
}