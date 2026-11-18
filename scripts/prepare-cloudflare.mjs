// Prepares dist/ for Cloudflare Pages (25 MiB per-file limit):
// removes the unused uncompressed music masters (the game streams the .mp3 versions).
import { globSync } from 'glob'
import { rmSync, statSync, writeFileSync } from 'node:fs'

for(const file of globSync('dist/**/*.wav'))
{
    rmSync(file)
    console.log('removed', file)
}

const tooBig = globSync('dist/**/*', { nodir: true }).filter(file => statSync(file).size > 25 * 1024 * 1024)
if(tooBig.length)
{
    console.error('Files over 25 MiB:', tooBig)
    process.exit(1)
}

// Long cache for hashed/immutable assets, short for the page itself
writeFileSync('dist/_headers', `/assets/*
  Cache-Control: public, max-age=31536000, immutable
/*.ktx
  Cache-Control: public, max-age=604800
/*.glb
  Cache-Control: public, max-age=604800
`)
console.log('dist ready for Cloudflare Pages')
