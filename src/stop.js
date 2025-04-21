import fs from "fs";
import path from "path";
import { exec } from "child_process";

export const Stop = {
  stop() {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    return new Promise((mainResolve, mainReject) => {
      const stopServer = (dir, name) => {
        return new Promise((resolve, reject) => {
          const pidPath = path.join(homeDir, `.mrserver/${dir}.pid`);
          if (!fs.existsSync(pidPath)) {
            console.log(
              `ℹ️  [MrServer CLI] ${name} is not running (PID file missing).`,
            );
            return resolve();
          }
          let pid;
          try {
            pid = parseInt(fs.readFileSync(pidPath, "utf-8"), 10);
            if (isNaN(pid)) {
              throw new Error("Invalid PID in file");
            }
          } catch (err) {
            console.error(
              `❌ [MrServer CLI] Error reading PID file: ${err.message}`,
            );
            try {
              fs.unlinkSync(pidPath);
            } catch (unlinkErr) {
              console.error(
                `❌ [MrServer CLI] Error removing PID file: ${unlinkErr.message}`,
              );
            }
            return resolve();
          }
          if (process.platform === "win32") {
            exec(
              `powershell -Command "Get-Process -Id ${pid} -ErrorAction SilentlyContinue"`,
              (checkError) => {
                const cleanupPidFile = () => {
                  try {
                    fs.unlinkSync(pidPath);
                  } catch (unlinkErr) {
                    console.error(
                      `❌ [MrServer CLI] Error removing PID file: ${unlinkErr.message}`,
                    );
                  }
                };

                if (checkError) {
                  console.log(
                    `ℹ️  [MrServer CLI] Process ${pid} not found - already terminated`,
                  );
                  cleanupPidFile();
                  resolve();
                  return;
                }
                console.log(
                  `⏹️  [MrServer CLI] Terminating ${name} process (PID ${pid})...`,
                );
                exec(`taskkill /pid ${pid} /f /t`, (error) => {
                  cleanupPidFile();
                  if (error) {
                    if (
                      error.code === 128 ||
                      error.code === 1 ||
                      error.message.includes("not found") ||
                      error.message.includes("not running")
                    ) {
                      console.log(
                        `ℹ️  [MrServer CLI] Process ${pid} not found or already terminated`,
                      );
                    } else {
                      console.error(
                        `❌ [MrServer CLI] Error terminating process: ${error.message}`,
                      );
                    }
                  } else {
                    console.log(
                      `✅ [MrServer CLI] ${name} stopped (PID ${pid})`,
                    );
                  }
                  resolve();
                });
              },
            );
          } else {
            try {
              process.kill(pid, 0);
              process.kill(pid);
              fs.unlinkSync(pidPath);
              console.log(`✅ [MrServer CLI] ${name} stopped (PID ${pid})`);
              resolve();
            } catch (err) {
              if (err.code === "ESRCH") {
                console.log(
                  `ℹ️  [MrServer CLI] Process ${pid} not found - already terminated`,
                );
                fs.unlinkSync(pidPath);
                resolve();
                return;
              }
              reject(
                `❌ [MrServer CLI] Failed to stop ${name} (PID ${pid}): ${err.message}`,
              );
            }
          }
        });
      };

      setTimeout(() => {
        Promise.all([
          stopServer("api", "Backend"),
          stopServer("ui", "Frontend"),
        ])
          .then(() => {
            console.log("✅ [MrServer CLI] MrServer stopped.");
            mainResolve();
          })
          .catch((err) => {
            console.error("❌ [MrServer CLI] Failed to stop:", err);
            mainReject(err);
          });
      }, 500);
    });
  },
};
