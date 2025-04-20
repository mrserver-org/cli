import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

export const Start = {
    start() {
        const homeDir = process.env.HOME || process.env.USERPROFILE;
        const mrserverDir = path.join(homeDir, '.mrserver');
        if (!existsSync(mrserverDir)) {
            console.log(`📁 [MrServer CLI] Creating directory ${mrserverDir}`);
            try {
                mkdirSync(mrserverDir, { recursive: true });
            } catch (err) {
                console.error(`❌ [MrServer CLI] Failed to create directory: ${err.message}`);
                return;
            }
        }

        const startServer = (dir, name) => {
            return new Promise((resolve, reject) => {
                const fullPath = path.join(homeDir, '.mrserver', dir);
                if (!fs.existsSync(fullPath)) {
                    console.log(`⚠️  [MrServer CLI] Directory ${fullPath} does not exist.`);
                    resolve();
                    return;
                }
                
                const proc = spawn('npm', ['run', 'start'], {
                    cwd: fullPath,
                    detached: true,
                    stdio: ['ignore', 'ignore', 'ignore'],
                    shell: process.platform === 'win32',
                    windowsHide: true
                });

                proc.on('error', (err) => {
                    reject(`❌ [MrServer CLI] Failed to start ${name}: ${err.message}`);
                });
                
                proc.unref();

                const pidPath = path.join(homeDir, `.mrserver/${dir}.pid`);
                fs.writeFile(pidPath, proc.pid.toString(), (err) => {
                    if (err) {
                        reject(`❌ [MrServer CLI] Failed to write PID for ${name}`);
                    } else {
                        console.log(`✅ [MrServer CLI] ${name} started (PID ${proc.pid})`);
                        resolve();
                    }
                });
            });
        };

        Promise.all([
            startServer('api', 'Backend'),
            startServer('ui', 'Frontend')
        ])
        .then(() => {
            console.log('✅ [MrServer CLI] MrServer started!');
            console.log('🌐 [MrServer CLI] Access it at http://127.0.0.1:1101 or the device\'s IP address');
        })
        .catch((err) => {
            console.error('❌ [MrServer CLI] Failed to start:', err);
        });
    }
}