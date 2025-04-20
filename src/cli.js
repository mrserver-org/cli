#!/usr/bin/env node
import { Command } from 'commander';
import { Install }  from './install.js';
import { Start } from './start.js';
import { Stop } from './stop.js';
import { Apps } from './apps.js';
import { Users } from './users.js';
import config from './config.js';
import './users.js';

const program = new Command();
const version = config.version;
const repo = config.repo;
program
      .option("-i, --install", 'Installs/Updates MrServer into the machine')
      .option("-s, --start", 'Starts MrServer')
      .option("-S, --stop", 'Stops MrServer')
      .option("-r, --restart", 'Restarts MrServer')
      .option("-a, --app-install <appId>", 'Installs an app from the MrServer Apps Repository')
      .option("-u, --users", 'Lists all users')
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
        mr -u, --users       👥 Lists all users
        mr useradd           ➕ Adds a user
        mr rmuser            ➖ Removes a user
        mr -v, --version     ℹ️ Shows current version
        mr -h, --help        📚 Displays this help information
        ───────────────────────────────────────────────────────
        `)
        .addHelpText('after', `
         ───────────────────────────────────────────────────────
         `)     
      .command('useradd <username> <password>')
      .description('Adds a new user')
      .action((username, password) => {
         try {
            Users.addUser(username, password);
            process.exit(0);
         } catch (err) {
            console.error("❌ [MrServer CLI] Failed to add user:", err);
            process.exit(1);
         }
      });
      program
      .command('rmuser <username>')
      .description('Removes a new user')
      .action((username) => {
         try {
            Users.removeUser(username);
            process.exit(0);
         } catch (err) {
            console.error("❌ [MrServer CLI] Failed to remove user:", err);
            process.exit(1);
         }
      });
      program
      .command('users')
      .description('Lists all users')
      .action((username) => {
         try {
            Users.listUsers();
            process.exit(0); 
         } catch (err) {
            console.error("❌ [MrServer CLI] Failed to list users:", err);
            process.exit(1);
         }
      });
      program.parse(process.argv);

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

if(program.opts().users) {
    Users.listUsers();
    process.exit(0);
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
