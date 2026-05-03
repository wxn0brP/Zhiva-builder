import { $ } from "bun";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Config, LogLevel, Os } from "./types";
import { log, logError } from "./utils";

const baseLink = "https://github.com/wxn0brP/Zhiva-native/releases/download/native/";
const SERVER_VERSION_FILE = "zhiva.nv.txt";

const fileNames: Record<Os, string> = {
    win32: "zhiva-win32.exe",
    linux: "zhiva-linux",
    darwin: "zhiva-darwin"
};

export function getEngineFileName(os: Os): string {
    return fileNames[os];
}

export function getEngineFilePath(config: Config, os: Os): string {
    const paths: Record<Os, string> = {
        win32: join(config.output.dir, os, "zhiva.exe"),
        linux: join(config.output.dir, os, "zhiva"),
        darwin: join(config.output.dir, os, "zhiva")
    };
    return paths[os];
}

function getLocalVersionFilePath(config: Config, os: Os): string {
    return join(config.output.dir, os, `nv.txt`);
}

async function downloadEngine(config: Config, os: Os, serverVersion: string): Promise<void> {
    const engineFilePath = getEngineFilePath(config, os);
    const engineFileName = getEngineFileName(os);

    log(LogLevel.INFO, "05-20", `Downloading Zhiva for ${os}...`);

    const dir = join(config.output.dir, os);
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });

    log(LogLevel.DEBUG, "05-21", `Downloading ${baseLink}${engineFileName}`);
    await $`curl -L ${baseLink}${engineFileName} -o ${engineFilePath}`;

    if (os !== "win32")
        await $`chmod +x ${engineFilePath}`;

    const localVersionPath = getLocalVersionFilePath(config, os);
    writeFileSync(localVersionPath, serverVersion.trim(), "utf-8");

    log(LogLevel.INFO, "05-22", `Zhiva for ${os} downloaded successfully (v${serverVersion.trim()})`);
}

async function checkEngineForOS(
    config: Config,
    os: Os,
    serverVersion: string
): Promise<boolean> {
    const engineFilePath = getEngineFilePath(config, os);
    const localVersionPath = getLocalVersionFilePath(config, os);

    try {
        const binaryExists = existsSync(engineFilePath);
        const localVersion = existsSync(localVersionPath)
            ? readFileSync(localVersionPath, "utf-8").trim()
            : null;

        if (binaryExists && localVersion === serverVersion.trim()) {
            log(LogLevel.INFO, "05-10", `Zhiva engine for ${os} is up to date (v${serverVersion.trim()})`);
            return true;
        }

        if (!binaryExists) {
            log(LogLevel.INFO, "05-11", `Binary missing for ${os}, downloading...`);
        } else {
            log(LogLevel.INFO, "05-12", `Version mismatch for ${os} (local: ${localVersion} != server: ${serverVersion.trim()}), updating...`);
        }

        await downloadEngine(config, os, serverVersion);
        return true;

    } catch (e) {
        logError("05-13", `Error checking Zhiva for ${os}:`, e);
        return false;
    }
}

export async function checkEngines(config: Config): Promise<void> {
    const platforms: Os[] = [];
    if (config.win32) platforms.push("win32");
    if (config.linux) platforms.push("linux");
    if (config.darwin) platforms.push("darwin");

    if (platforms.length === 0) {
        log(LogLevel.INFO, "05-01", "No platforms enabled in config, skipping engine check");
        return;
    }

    log(LogLevel.IMPORTANT, "05-02", `Checking Zhiva engines for: ${platforms.join(", ")}`);

    try {
        log(LogLevel.DEBUG, "05-03", "Fetching server version...");
        const serverVersion = await fetch(baseLink + SERVER_VERSION_FILE)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(text => text.trim());

        log(LogLevel.DEBUG, "05-04", `Server version: ${serverVersion}`);

        for (const os of platforms)
            await checkEngineForOS(config, os, serverVersion);

        log(LogLevel.CRITICAL, "05-30", "Engine check completed");

    } catch (e) {
        logError("05-31", "Failed to fetch server version:", e);

        for (const os of platforms) {
            const engineFilePath = getEngineFilePath(config, os);
            if (!existsSync(engineFilePath))
                console.warn(`[Z-BLD-05-32] Cannot verify ${os}: server unreachable AND binary missing`);
        }
    }
}
