import fs from "fs-extra";
import path from "path";
import { execSync } from "child_process";
import inquirer from "inquirer";
import { logStep, logSuccess, logError, logInfo } from "../utils/logger.js";
import chalk from "chalk";

const SIMPLE_HOMEPAGE_CONTENT = `export default function HomePage() {
  return <div>Home Page</div>;
}
`;

function isGitInstalled(): boolean {
  try {
    execSync("git --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function isGitTracked(cwd: string): boolean {
  try {
    const isInside = execSync("git rev-parse --is-inside-work-tree", {
      cwd,
      stdio: "pipe",
    })
      .toString()
      .trim();
    return isInside === "true";
  } catch {
    return false;
  }
}

function hasUncommittedChanges(cwd: string): boolean {
  try {
    const status = execSync("git status --porcelain", {
      cwd,
      stdio: "pipe",
    })
      .toString()
      .trim();
    return status.length > 0;
  } catch {
    return true;
  }
}

export async function runCleanCommand() {
  const cwd = process.cwd();

  // 1. Safety Check: Git Installed
  if (!isGitInstalled()) {
    logError("Git is not installed on your system. Boilerplate cleanup requires Git tracking for safety.");
    process.exit(1);
  }

  // 2. Safety Check: Git Tracking Enabled
  if (!isGitTracked(cwd)) {
    logError("Git tracking is not enabled in this project. Cleanup aborted for safety.");
    logInfo("Please initialize Git (`git init`) and make an initial commit before running clean.");
    process.exit(1);
  }

  // 3. Safety Check: No Uncommitted Changes
  if (hasUncommittedChanges(cwd)) {
    logError("Uncommitted changes detected in your repository. Cleanup aborted for safety.");
    logInfo("Please commit or stash your changes before running the clean command.");
    process.exit(1);
  }

  // 4. Prompt for User Confirmation
  const { confirmClean } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmClean",
      message: "Are you sure you want to clean up the boilerplate? This will empty README.md and reset src/pages/index.tsx.",
      default: false,
    },
  ]);

  if (!confirmClean) {
    logInfo("Boilerplate cleanup cancelled.");
    return;
  }

  logStep("Cleaning boilerplate code...");

  try {
    // Empty README.md
    const readmePath = path.resolve(cwd, "README.md");
    await fs.writeFile(readmePath, "");
    logSuccess(`Emptied ${chalk.cyan("README.md")}`);

    // Update main homepage index.tsx
    const indexPath = path.resolve(cwd, "src/pages/index.tsx");
    await fs.ensureDir(path.dirname(indexPath));
    await fs.writeFile(indexPath, SIMPLE_HOMEPAGE_CONTENT, "utf-8");
    logSuccess(`Updated ${chalk.cyan("src/pages/index.tsx")} to simple HomePage component`);

    // Remove "clean" script from package.json
    const packageJsonPath = path.resolve(cwd, "package.json");
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJSON(packageJsonPath);
      if (pkg.scripts && pkg.scripts.clean) {
        delete pkg.scripts.clean;
        await fs.writeJSON(packageJsonPath, pkg, { spaces: 2 });
        logSuccess(`Removed ${chalk.cyan('"clean"')} script from package.json`);
      }
    }

    logSuccess(chalk.bold.green("Boilerplate cleaned successfully!"));
  } catch (error) {
    logError("Error while cleaning boilerplate:", error);
    process.exit(1);
  }
}
