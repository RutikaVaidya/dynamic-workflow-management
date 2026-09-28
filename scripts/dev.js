const { spawn, spawnSync } = require('node:child_process')
const path = require('node:path')

const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? 'npm.cmd' : 'npm'
const root = path.resolve(__dirname, '..')

const commands = [
  { name: 'backend', command: `${npmCommand} run dev:backend` },
  { name: 'frontend', command: `${npmCommand} run dev:frontend` },
]

const running = new Set()

function start({ name, command }) {
  console.log(`[dev] starting ${name}...`)
  const child = spawn(command, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })

  running.add(child)

  child.on('exit', (code, signal) => {
    running.delete(child)
    console.error(
      `[dev] ${name} exited (code=${code ?? 'null'}, signal=${signal ?? 'none'})`
    )
    stopAll()
    process.exit(code ?? 1)
  })

  return child
}

function stopAll() {
  for (const child of running) {
    if (isWindows) {
      try {
        spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
          stdio: 'ignore',
        })
      } catch {
        // ignore
      }
    } else {
      try {
        child.kill('SIGTERM')
      } catch {
        // ignore
      }
    }
  }
  running.clear()
}

for (const command of commands) {
  start(command)
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopAll()
    process.exit(0)
  })
}