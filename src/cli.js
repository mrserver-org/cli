#!/usr/bin/env node
import { Command } from "commander";
import { Install } from "./install.js";
import { Start } from "./start.js";
import { Stop } from "./stop.js";
import { Apps } from "./apps.js";
import { Users } from "./users.js";
import config from "./config.js";
import "./users.js";

const program = new Command();
const version = config.version;
program
  .version(version, "-v, --version", "Get the current version of MrServer")
  .usage("[command]")
  .addHelpText(
    "before",
    `
        ┌─────────────────────────────────────────────────────┐
        │                  🚀 MrServer CLI                    │
        └─────────────────────────────────────────────────────┘
     
        📋 Commands:
        ───────────────────────────────────────────────────────
        mr install           📥 Installs/Updates MrServer
        mr start             ▶️ Starts MrServer
        mr stop              ⏹️ Stops MrServer
        mr restart           🔄 Restarts MrServer
        mr app-install       📦 Installs an app from Apps repo.
        mr users             👥 Lists all users
        mr useradd           ➕ Adds a user
        mr rmuser            ➖ Removes a user
		mr roles             💻 List roles
        mr -v, --version     ℹ️ Shows current version
        mr -h, --help        📚 Displays this help information
        ───────────────────────────────────────────────────────
        `,
  )
  .addHelpText(
    "after",
    `
         ───────────────────────────────────────────────────────
         `,
  )
  .command("useradd <username> <password> <role>")
  .description("Adds a new user")
  .action((username, password, role) => {
    try {
      Users.addUser(username, password, role);
      process.exit(0);
    } catch (err) {
      console.error("❌ [MrServer CLI] Failed to add user:", err);
      process.exit(1);
    }
  });

program.option(
  "-r, --repo <repo>",
  "Specify the repository URL for app installation"
);

program
  .command("rmuser <username>")
  .description("Removes a new user")
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
  .command("users")
  .description("Lists all users")
  .action((username) => {
    try {
      Users.listUsers();
      process.exit(0);
    } catch (err) {
      console.error("❌ [MrServer CLI] Failed to list users:", err);
      process.exit(1);
    }
  });

program
  .command("install")
  .description("Installs/Updates MrServer")
  .action(async () => {
    try {
      console.log("📥 [MrServer CLI] Installing/Updating MrServer...");
      await Install.install(version);
    } catch (err) {
      console.error("❌ [MrServer CLI] Installation failed:", err);
      process.exit(1);
    }
  });

program
  .command("start")
  .description("Starts MrServer")
  .action(() => {
    console.log("▶️  [MrServer CLI] STARTING MrServer...");
    Start.start();
  });

program
  .command("stop")
  .description("Stops MrServer")
  .action(() => {
    console.log("⏹️  [MrServer CLI] STOPPING MrServer...");
    Stop.stop()
      .then(() => {
        console.log("✅ [MrServer CLI] MrServer has been stopped successfully");
        process.exit(0);
      })
      .catch((err) => {
        console.error("❌ [MrServer CLI] Error stopping MrServer:", err);
        process.exit(1);
      });
  });

program
  .command("restart")
  .description("Restarts MrServer")
  .action(() => {
    console.log("🔄 [MrServer CLI] RESTARTING MrServer...");
    Stop.stop();
    setTimeout(() => {
      Start.start();
      process.exit(0);
    }, 2000);
  });

program
  .command("app-install <appId>")
  .description("Installs an app from the MrServer Apps Repository")
  .action((appId) => {
    let repo = program.opts().repo || config.repo;
    console.log(`📦 [MrServer CLI] Installing app: ${appId}`);
    console.log(`🔗 [MrServer CLI] Using repository: ${repo}`);
    (async () => {
      try {
        await Apps.install(appId, repo);
        process.exit(0);
      } catch (err) {
        console.error(`❌ [MrServer CLI] ${err}`);
        process.exit(1);
      }
    })();
  });

program
  .command("roles")
  .description("List the available roles.")
  .action(() => {
    console.log("📃 [MrServer CLI] Roles:");
    console.log("- admin\n- user\n- guest");
  });

program.parse(process.argv);

if (!process.argv.length > 2) {
  console.log("⚠️ [MrServer CLI] NO ACTION SPECIFIED");
  console.log("📚 Use 'mr --help' to see available commands");
  process.exit(1);
}
