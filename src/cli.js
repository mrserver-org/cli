import { Command } from 'commander';
import { Install }  from './install.js';
import { Start } from './start.js';
import { Stop } from './stop.js';
import { Apps } from './apps.js';

const program = new Command();
const version = "v1.0.0";
const repo = "https://raw.githubusercontent.com/mrserver-org/apps/refs/heads/main"; // todo: change this to a config file

program
   .option("-i, --install", 'Installs/Updates MrServer into the machine')
   .option("-s, --start", 'Starts MrServer')
   .option("-S, --stop", 'Stops MrServer')
   .option("-r, --restart", 'Restarts MrServer')
   .option("-a, --app-install <appId>", 'Installs an app from the MrServer Apps Repository')
   .version(version, '-v, --version', 'Get the current version of MrServer')
   .usage('[options]')
   .addHelpText('before', `
   ┌─────────────────────────────────────────────────────┐
   │                  🚀 MrServer CLI                    │
   └─────────────────────────────────────────────────────┘

   📋 Commands:
   ───────────────────────────────────────────────────────
   mr -i, --install     📥 Installs/Updates MrServer
   mr -s, --start       ▶️  Starts MrServer
   mr -S, --stop        ⏹️ Stops MrServer
   mr -r, --restart     🔄 Restarts MrServer
   mr -a, --app-install 📦 Installs an app from Apps repo.
   mr -v, --version     ℹ️ Shows current version
   mr -h, --help        📚 Displays this help information
   ───────────────────────────────────────────────────────
   `)
   .addHelpText('after', `
    ───────────────────────────────────────────────────────
    `).parse(process.argv);

if (program.opts().install) {
    (async () => {
        try {
            console.log("📥 [MrServer CLI] Installing/Updating MrServer...");
            await Install.install(version);
            process.exit(0);
        } catch (err) {
            console.error("❌ [MrServer CLI] Installation failed:", err);
            process.exit(1);
        }
    })();
}

if(program.opts().start) {
    console.log("▶️  [MrServer CLI] STARTING MrServer...");
    Start.start();
}

if(program.opts().stop) {
    console.log("⏹️  [MrServer CLI] STOPPING MrServer...");
    Stop.stop()
        .then(() => {
            console.log("✅ [MrServer CLI] MrServer has been stopped successfully");
            process.exit(0);
        })
        .catch(err => {
            console.error("❌ [MrServer CLI] Error stopping MrServer:", err);
            process.exit(1);
        });
}

if(program.opts().restart) {
    console.log("🔄 [MrServer CLI] RESTARTING MrServer...");
    Stop.stop();
    setTimeout(() => {
        Start.start();
        process.exit(0);
    }, 2000);
}

if(program.opts().appInstall) {
    console.log(`📦 [MrServer CLI] Installing app: ${program.opts().appInstall}`);
    console.log(`🔗 Using repository: ${repo}`);
    (async () => {
        try {
            await Apps.install(program.opts().appInstall, repo);
            process.exit(0);
        } catch (err) {
            console.error(`❌ [MrServer CLI] Failed to install app:`, err);
            process.exit(1);
        }
    })();
}

if(!program.opts().install && !program.opts().start && !program.opts().stop && !program.opts().restart && !program.opts().appInstall) {
    console.log("⚠️ [MrServer CLI] NO ACTION SPECIFIED");
    console.log("📚 Use 'mr --help' to see available commands");
    process.exit(1);
}
