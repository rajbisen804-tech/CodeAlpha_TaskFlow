const { spawn } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '   🚀 Launching TaskFlow Pro Full-Stack Suite');
console.log('\x1b[36m%s\x1b[0m', '==================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const serverProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true
});

const clientProcess = spawn(npmCmd, ['run', 'dev'], {
  cwd: clientDir,
  stdio: 'inherit',
  shell: true
});

const cleanup = () => {
  console.log('\n\x1b[33m%s\x1b[0m', '🛑 Shutting down TaskFlow Pro processes...');
  if (serverProcess) serverProcess.kill();
  if (clientProcess) clientProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
