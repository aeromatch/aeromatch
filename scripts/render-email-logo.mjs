import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const svgPath = path.resolve(__dirname, '..', 'public', 'logo-email.svg')
const outPath = path.resolve(__dirname, '..', 'public', 'logo-email.png')

const svg = readFileSync(svgPath)

await sharp(svg, { density: 300 })
  .resize({ width: 600 })
  .png({ compressionLevel: 9 })
  .toFile(outPath)

console.log('Saved:', outPath)
