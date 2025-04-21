import { exec } from "child_process";
import fs from "fs";
import path from "path";
export const Install = {
  async cloneRepository(name, repoUrl, targetDir, branch = "main") {
    console.log(`📦 [MrServer CLI] Installing MrServer Component "${name}"...`);
    return new Promise((resolve, reject) => {
      if (fs.existsSync(targetDir)) {
        const command = `cd ${targetDir} && git pull ${repoUrl} ${branch}`;
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(`Error updating repository: ${stderr}`);
          } else {
            resolve(stdout);
          }
        });
        return;
      }
      const command = `git clone -b ${branch} ${repoUrl} ${targetDir}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error cloning repository: ${stderr}`);
        } else {
          resolve(stdout);
        }
      });
    });
  },

  async installDependencies(targetDir) {
    console.log("📃 [MrServer CLI] Installing dependencies...");
    return new Promise((resolve, reject) => {
      const command = `npm install --prefix ${targetDir}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`[MrServer CLI] Error installing dependencies: ${stderr}`);
        } else {
          resolve(stdout);
        }
      });
    });
  },

  async install(version) {
    const uiRepo = "https://github.com/mrserver-org/ui.git";
    const apiRepo = "https://github.com/mrserver-org/api.git";
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const mrserverDir = path.join(homeDir, ".mrserver");
    if (!fs.existsSync(mrserverDir)) {
      console.log(`📁 [MrServer CLI] Creating directory ${mrserverDir}`);
      try {
        fs.mkdirSync(mrserverDir, { recursive: true });
      } catch (err) {
        console.error(
          `❌ [MrServer CLI] Failed to create directory: ${err.message}`,
        );
        throw err;
      }
    }

    const uiTargetDir = path.join(mrserverDir, "ui");
    const apiTargetDir = path.join(mrserverDir, "api");
    await this.cloneRepository("ui", uiRepo, uiTargetDir, version)
      .then(async () => await this.installDependencies(uiTargetDir))
      .then(
        async () =>
          await this.cloneRepository("api", apiRepo, apiTargetDir, version),
      )
      .then(async () => await this.installDependencies(apiTargetDir))
      .then(() => {
        console.log("✅ [MrServer CLI] Installation complete!");
        console.log("🚀 [MrServer CLI] MrServer has been installed.");
        console.log(
          "▶️  [MrServer CLI] You can now start the server using the start command.",
        );
      })
      .catch((error) => {
        console.error("❌ [MrServer CLI] Installation failed:", error);
      });
  },
};
