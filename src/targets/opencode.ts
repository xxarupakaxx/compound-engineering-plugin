import path from "path"
import { backupFile, copyDir, ensureDir, writeJson, writeText } from "../utils/files"
import type { OpenCodeBundle } from "../types/opencode"

export async function writeOpenCodeBundle(outputRoot: string, bundle: OpenCodeBundle): Promise<void> {
  const openCodePaths = resolveOpenCodePaths(outputRoot)
  await ensureDir(openCodePaths.root)

  const backupPath = await backupFile(openCodePaths.configPath)
  if (backupPath) {
    console.log(`Backed up existing config to ${backupPath}`)
  }
  await writeJson(openCodePaths.configPath, bundle.config)

  const agentsDir = openCodePaths.agentsDir
  for (const agent of bundle.agents) {
    await writeText(path.join(agentsDir, `${agent.name}.md`), agent.content + "\n")
  }

  for (const commandFile of bundle.commandFiles) {
    const dest = path.join(openCodePaths.commandDir, `${commandFile.name}.md`)
    const cmdBackupPath = await backupFile(dest)
    if (cmdBackupPath) {
      console.log(`Backed up existing command file to ${cmdBackupPath}`)
    }
    await writeText(dest, commandFile.content + "\n")
  }

  if (bundle.plugins.length > 0) {
    const pluginsDir = openCodePaths.pluginsDir
    for (const plugin of bundle.plugins) {
      await writeText(path.join(pluginsDir, plugin.name), plugin.content + "\n")
    }
  }

  if (bundle.skillDirs.length > 0) {
    const skillsRoot = openCodePaths.skillsDir
    for (const skill of bundle.skillDirs) {
      await copyDir(skill.sourceDir, path.join(skillsRoot, skill.name))
    }
  }
}

function resolveOpenCodePaths(outputRoot: string) {
  const base = path.basename(outputRoot)
  // Global install: ~/.config/opencode (basename is "opencode")
  // Project install: .opencode (basename is ".opencode")
  if (base === "opencode" || base === ".opencode") {
    return {
      root: outputRoot,
      configPath: path.join(outputRoot, "opencode.json"),
      agentsDir: path.join(outputRoot, "agents"),
      pluginsDir: path.join(outputRoot, "plugins"),
      skillsDir: path.join(outputRoot, "skills"),
      // .md command files; alternative to the command key in opencode.json
      commandDir: path.join(outputRoot, "commands"),
    }
  }

  // Custom output directory - nest under .opencode subdirectory
  return {
    root: outputRoot,
    configPath: path.join(outputRoot, "opencode.json"),
    agentsDir: path.join(outputRoot, ".opencode", "agents"),
    pluginsDir: path.join(outputRoot, ".opencode", "plugins"),
    skillsDir: path.join(outputRoot, ".opencode", "skills"),
    // .md command files; alternative to the command key in opencode.json
    commandDir: path.join(outputRoot, ".opencode", "commands"),
  }
}