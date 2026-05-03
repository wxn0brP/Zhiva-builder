import { type Build } from "bun";
import { execSync } from "child_process";
import { copyFileSync, writeFileSync } from "fs";
import { join } from "path";
import { createArchives } from "./archive";
import { checkEngines, getEngineFilePath } from "./engine";
import { createFpmPackages } from "./fpm";
import { Config, LogLevel, Os } from "./types";
import { copyFiles, log, logError } from "./utils";
import { packageJson, zhivaConfig } from "./vars";

export async function build(config: Config) {
    log(LogLevel.CRITICAL, "02-01", "Starting build process...");

    if (config.build.cmd) {
        log(LogLevel.INFO, "02-02", `Running build command: ${config.build.cmd}`);
        execSync(config.build.cmd, {
            shell: "bash",
        });
    }

    await checkEngines(config);
    await buildBackend(config);

    if (config.linux) await buildForSystem(config, "linux");
    if (config.win32) await buildForSystem(config, "win32");
    if (config.darwin) await buildForSystem(config, "darwin");

    if (config.linux?.fpm?.length && !config.noFpm)
        createFpmPackages(config);

    log(LogLevel.CRITICAL, "02-03", "Build process completed");
}

async function buildBackend(config: Config) {
    log(LogLevel.CRITICAL, "02-04", "Building backend...");

    await Bun.build({
        entrypoints: [packageJson.main],
        target: "bun",
        naming: "zhiva-index.js",
        minify: true,
        outdir: config.output.dir
    }).catch(e => {
        logError("02-05", "Error building backend:", e);
        process.exit(1);
    });

    const env = {
        ZHIVA_ROOT: "./",
        ZHIVA_ASSETS: "./assets",
        NODE_ENV: 'production',
        ...(config.env || {})
    };

    writeFileSync(
        join(config.output.dir, "zhiva-index-bun.js"),
        `const i = "./zhiva-index.js";
${Object.entries(env).map(([k, v]) => `process.env['${k}'] = ${JSON.stringify(v)};`).join("\n")}
import(i);`,
        "utf-8");

    log(LogLevel.CRITICAL, "02-06", "Backend built successfully");
}

async function buildForSystem(config: Config, os: Os) {
    log(LogLevel.CRITICAL, "02-07", `Building for ${os}...`);

    const tempDir = join(config.output.dir, os, config.output.name);

    log(LogLevel.DEBUG, "02-08", `Copying files to ${tempDir}`);
    await copyFiles(config.files, tempDir);
    await copyFiles(
        [join("node_modules", "@wxn0brp", "zhiva-base-lib", "assets") + ":assets"],
        tempDir
    );
    copyFileSync(join(config.output.dir, "zhiva-index.js"), join(tempDir, "zhiva-index.js"));

    const osConfig = config[os];

    if (osConfig.cmd) {
        log(LogLevel.INFO, "02-09", `Running ${os} command: ${osConfig.cmd}`);
        execSync(osConfig.cmd, {
            shell: "bash",
        });
    }

    await buildBin(config, tempDir, os);

    const zhivaEnginePath = getEngineFilePath(config, os);
    log(LogLevel.DEBUG, "02-10", `Copying Zhiva engine to ${tempDir}`);
    copyFileSync(zhivaEnginePath, join(tempDir, `zhiva${os === "win32" ? ".exe" : ""}`));

    if (!config.noArchive)
        createArchives(tempDir, osConfig.format, os, config.output.name);

    log(LogLevel.CRITICAL, "02-11", `Build for ${os} completed`);
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

    log(LogLevel.INFO, "02-09", `Building binary for ${os}: ${bin}`);

    await Bun.build({
        entrypoints: [
            join(config.output.dir, "zhiva-index-bun.js")
        ],
        compile: {
            outfile: bin,
            target: binTarget[os]
        }
    }).catch(e => {
        logError("02-09", `Error building binary for ${os}:`, e);
        process.exit(1);
    });

    log(LogLevel.INFO, "02-10", `Binary built successfully: ${bin}`);
}
