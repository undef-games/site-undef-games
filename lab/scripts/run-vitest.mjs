import { spawnSync } from 'node:child_process'

const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== '--runInBand')

const result = spawnSync(
  process.execPath,
  ['./node_modules/vitest/vitest.mjs', ...forwardedArgs],
  {
    stdio: 'inherit'
  }
)

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
