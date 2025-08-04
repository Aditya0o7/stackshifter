// stackshifter\commands\react-nextjs\processUtils.js\\
import { spawn } from 'child_process';
import fs from 'fs';
export async function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Running: ${command}`);
    const child = spawn(command, { shell: true, stdio: 'inherit', ...options });
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ Command completed: ${command}`);
        resolve();
      } else {
        reject(new Error(`❌ Command failed with code ${code}: ${command}`));
      }
    });
  });
}

export function validateDirectory(dirPath, shouldExist = true) {
  const exists = fs.existsSync(dirPath);
  
  if (shouldExist && !exists) {
    throw new Error(`Directory does not exist: ${dirPath}`);
  }
  
  if (!shouldExist && exists) {
    throw new Error(`Directory already exists: ${dirPath}`);
  }
  
  return true;
}