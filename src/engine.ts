import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { Config, Os } from "./types";
import { $ } from "bun";

const baseLink = "https://github.com/wxn0brP/Zhiva-native/releases/download/native/";
const SERVER_VERSION_FILE = "zhiva.nv.txt";

const fileNames: Record<Os, string> = {
    win32: "zhiva-win32.exe",
    linux: "zhiva-linux",
    darwin: "zhiva-macos"
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

    console.log(`[Z-BLD-5-02] Downloading Zhiva for ${os}...`);

    const dir = join(config.output.dir, os);
    if (!existsSync(dir))
        mkdirSync(dir, { recursive: true });

    await $`curl -L ${baseLink}${engineFileName} -o ${engineFilePath}`;

    if (os !== "win32")
        await $`chmod +x ${engineFilePath}`;

    const localVersionPath = getLocalVersionFilePath(config, os);
    writeFileSync(localVersionPath, serverVersion.trim(), "utf-8");

    console.log(`[Z-BLD-5-03] Zhiva for ${os} downloaded successfully (v${serverVersion.trim()})`);
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
            console.log(`[Z-BLD-5-04] Zhiva engine for ${os} is up to date (v${serverVersion.trim()})`);
            return true;
        }

        if (!binaryExists) {
            console.log(`[Z-BLD-5-05] Binary missing for ${os}, downloading...`);
        } else {
            console.log(`[Z-BLD-5-06] Version mismatch for ${os} (local: ${localVersion} ≠ server: ${serverVersion.trim()}), updating...`);
        }

        await downloadEngine(config, os, serverVersion);
        return true;

    } catch (e) {
        console.error(`[Z-BLD-5-01] Error checking Zhiva for ${os}:`, e);
        return false;
    }
}

export async function checkEngines(config: Config): Promise<void> {
    const platforms: Os[] = [];
    if (config.win32) platforms.push("win32");
    if (config.linux) platforms.push("linux");
    if (config.darwin) platforms.push("darwin");

    if (platforms.length === 0) {
        console.log("[Z-BLD-5-07] No platforms enabled in config, skipping engine check");
        return;
    }

    console.log(`[Z-BLD-5-08] Checking Zhiva engines for: ${platforms.join(", ")}`);

    try {
        console.log("[Z-BLD-5-10] Fetching server version...");
        const serverVersion = await fetch(baseLink + SERVER_VERSION_FILE)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.text();
            })
            .then(text => text.trim());

        console.log(`[Z-BLD-5-11] Server version: ${serverVersion}`);

        for (const os of platforms)
            await checkEngineForOS(config, os, serverVersion);

        console.log("[Z-BLD-5-09] Engine check completed");

    } catch (e) {
        console.error("[Z-BLD-5-12] Failed to fetch server version:", e);

        for (const os of platforms) {
            const engineFilePath = getEngineFilePath(config, os);
            if (!existsSync(engineFilePath))
                console.warn(`[Z-BLD-5-13] Cannot verify ${os}: server unreachable AND binary missing`);
        }
    }
}
