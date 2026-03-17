import { type Build } from "bun";
import { execSync } from "child_process";
import { copyFileSync } from "fs";
import { join } from "path";
import { createArchives } from "./archive";
import { checkEngines, getEngineFilePath } from "./engine";
import { createFpmPackages } from "./fpm";
import { Config, Os } from "./types";
import { copyFiles } from "./utils";
import { packageJson, zhivaConfig } from "./vars";

export async function build(config: Config, positionals: string[]) {
    if (config.build.cmd) {
        execSync(config.build.cmd, {
            shell: "bash",
        });
    }

    await checkEngines(config);

    if (config.linux) await buildForSystem(config, "linux");
    if (config.win32) await buildForSystem(config, "win32");
    if (config.darwin) await buildForSystem(config, "darwin");

    if (config.linux?.fpm && !config.noFpm)
        createFpmPackages(config);
}

async function buildForSystem(config: Config, os: Os) {
    const tempDir = join(config.output.dir, os, config.output.name);

    await copyFiles(config.files, tempDir);
    await copyFiles(
        [join("node_modules", "@wxn0brp", "zhiva-base-lib", "assets")],
        tempDir
    );

    const osConfig = config[os];

    if (osConfig.cmd) {
        execSync(osConfig.cmd, {
            shell: "bash",
        });
    }

    await buildBin(config, tempDir, os);

    const zhivaEnginePath = getEngineFilePath(config, os);
    copyFileSync(zhivaEnginePath, join(tempDir, `zhiva${os === "win32" ? ".exe" : ""}`));

    if (!config.noArchive)
        createArchives(tempDir, osConfig.format, os, config.output.name);
}

const binExt = {
    "win32": ".exe",
    "darwin": "-macos",
    "linux": ".x86_64"
}

const binTarget: Record<Os, Build.CompileTarget> = {
    "win32": "bun-windows-x64",
    "darwin": "bun-darwin-x64",
    "linux": "bun-linux-x64"
}

async function buildBin(config: Config, tempDir: string, os: Os) {
    let bin = join(
        tempDir,
        zhivaConfig.name.replace(" ", "-") + binExt[os],
    );

    await Bun.build({
        entrypoints: [packageJson.main],
        compile: {
            outfile: bin,
            target: binTarget[os]
        },
        external: [
            "assets",
            ...config.files
        ],
        define: {
            "process.env.ZHIVA_ROOT": "./",
            "process.env.ZHIVA_ASSETS": "./assets"
        }
    });
}
