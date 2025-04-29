import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import AdmZip from "adm-zip";
import { exec } from "child_process";

async function downloadZip(url, destination) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destination, Buffer.from(buffer));
  console.log("📦 Download complete!");
  return destination;
}

async function downloadFile(url, destination) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destination, Buffer.from(buffer));
  return destination;
}

export const Apps = {
  async install(id, repo) {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const mrserverDir = path.join(homeDir, ".mrserver");
    const zipPath = path.join(mrserverDir, "app.zip");
    try {
      await downloadFile(`${repo}/${id}/preinstall.json`, path.join(mrserverDir, "preinstall.json"));
      console.log("💻 [MrServer CLI] Executing preinstall script...");
      const preinstall = JSON.parse(fs.readFileSync(path.join(mrserverDir, "preinstall.json"), "utf8"));
      if (preinstall) {
        await exec(`${preinstall.shell} ${preinstall.shellFlags} "${preinstall.command}"`, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ [MrServer CLI] Error executing preinstall script: ${error.message}`);
            throw error;
          }
          if (stderr) {
            console.error(stderr);
            throw new Error(stderr);
          }
          console.log(stdout);
        });
        fs.unlinkSync(path.join(mrserverDir, "preinstall.json"));
      }
    } catch {
      console.log("ℹ️  [MrServer CLI] No preinstall script found.. continuing with installation.");
    }
    await downloadZip(`${repo}/${id}/app.zip`, zipPath);
    console.log("✅ [MrServer CLI] Installing app...");

    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    const appDir = path.join(mrserverDir, "ui", "3rd_party_apps");
    const uiDir = path.join(mrserverDir, "ui");

    fs.mkdirSync(appDir, { recursive: true });

    let metadata;
    let appFiles = [];

    for (const entry of zipEntries) {
      const entryName = entry.entryName;

      if (entryName === "metadata.json") {
        metadata = JSON.parse(entry.getData().toString("utf8"));
      } else if (entryName.startsWith("app/")) {
        const fileName = path.basename(entryName);
        const targetPath = path.join(appDir, fileName);

        fs.writeFileSync(targetPath, entry.getData());
        appFiles.push(path.basename(fileName, ".js"));
      } else if (entryName.startsWith("extras/")) {
        const relativePath = entryName.substring("extras/".length);
        if (relativePath) {
          const targetPath = path.join(uiDir, relativePath);
          const targetDir = path.dirname(targetPath);

          fs.mkdirSync(targetDir, { recursive: true });
          fs.writeFileSync(targetPath, entry.getData());
        }
      }
    }

    if (metadata) {
      const appJsonPath = path.join(appDir, "list.json");
      let appsData = [];
      if (fs.existsSync(appJsonPath)) {
        try {
          appsData = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
        } catch {
          appsData = [];
        }
      }
      appsData.push(metadata);
      fs.writeFileSync(appJsonPath, JSON.stringify(appsData, null, 2));
    }

    const listJsonPath = path.join(appDir, ".json");
    let appsList = [];

    if (fs.existsSync(listJsonPath)) {
      try {
        appsList = JSON.parse(fs.readFileSync(listJsonPath, "utf8"));
      } catch (e) {
        appsList = [];
      }
    }

    appsList = [...new Set([...appsList, ...appFiles])];
    fs.writeFileSync(listJsonPath, JSON.stringify(appsList));

    fs.unlinkSync(zipPath);
    console.log(`✅ [MrServer CLI] App installed successfully!`);
  },
};
