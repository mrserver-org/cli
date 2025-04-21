import fs from "fs";
import path from "path";
import crypto from "crypto";
import chalk from "chalk";

export const Users = {
  getConfigPath() {
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const mrserverDir = path.join(homeDir, ".mrserver");
    const usersFile = path.join(mrserverDir, "users.json");
    return { mrserverDir, usersFile };
  },

  ensureMrserverDir() {
    const { mrserverDir } = this.getConfigPath();
    if (!fs.existsSync(mrserverDir)) {
      fs.mkdirSync(mrserverDir, { recursive: true });
    }
  },

  loadUsers() {
    this.ensureMrserverDir();
    const { usersFile } = this.getConfigPath();

    if (!fs.existsSync(usersFile)) {
      return [];
    }

    try {
      const data = fs.readFileSync(usersFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error(
        chalk.red(`❌ [MrServer CLI] Error loading users: ${error.message}`),
      );
      return [];
    }
  },

  saveUsers(users) {
    this.ensureMrserverDir();
    const { usersFile } = this.getConfigPath();

    try {
      fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), "utf8");
      return true;
    } catch (error) {
      console.error(
        chalk.red(`❌ [MrServer CLI] Error saving users: ${error.message}`),
      );
      return false;
    }
  },

  hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
  },

  addUser(username, password) {
    if (!username || !password) {
      console.error(
        chalk.red("❌ [MrServer CLI] Username and password are required"),
      );
      return false;
    }

    const users = this.loadUsers();

    if (users.some((user) => user.username === username)) {
      console.error(
        chalk.red(`❌ [MrServer CLI] User '${username}' already exists`),
      );
      return false;
    }

    users.push({
      username,
      password: this.hashPassword(password),
    });

    if (this.saveUsers(users)) {
      console.log(
        chalk.green(`✅ [MrServer CLI] User '${username}' added successfully`),
      );
      return true;
    }

    return false;
  },

  removeUser(username) {
    if (!username) {
      console.error(chalk.red("❌ [MrServer CLI] Username is required"));
      return false;
    }

    const users = this.loadUsers();
    const initialLength = users.length;
    const filteredUsers = users.filter((user) => user.username !== username);
    if (filteredUsers.length === initialLength) {
      console.error(
        chalk.red(`❌ [MrServer CLI] User '${username}' not found`),
      );
      return false;
    }

    if (this.saveUsers(filteredUsers)) {
      console.log(
        chalk.green(
          `✅ [MrServer CLI] User '${username}' removed successfully`,
        ),
      );
      return true;
    }

    return false;
  },

  listUsers() {
    const users = this.loadUsers();

    if (users.length === 0) {
      console.log(chalk.yellow("📃 [MrServer CLI] No users found"));
      return;
    }

    console.log(chalk.blue("📃 [MrServer CLI] Users:"));
    users.forEach((user) => {
      console.log(`  - ${user.username}`);
    });
  },

  verifyUser(username, password) {
    const users = this.loadUsers();
    const user = users.find((user) => user.username === username);

    if (!user) {
      return false;
    }

    return user.password === this.hashPassword(password);
  },
};
