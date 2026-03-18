import { mkdir, cp } from "fs/promises";
import { join } from "path";
import { LevelConfig, LogLevel } from "./types";

const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    bright: "\x1b[1m"
};

const levelConfig: LevelConfig = {
    [LogLevel.CRITICAL]: {
        color: colors.magenta,
        emoji: "💜 "
    },
    [LogLevel.IMPORTANT]: {
        color: colors.cyan
    },
    [LogLevel.INFO]: {
        color: colors.yellow
    },
    [LogLevel.DEBUG]: {
        color: colors.reset
    }
};

export function log(level: LogLevel, id: string, message: string, ...args: any[]) {
    const config = levelConfig[level];
    const emoji = config.emoji ? `${config.emoji} ` : "";
    const color = level === LogLevel.DEBUG ? "" : config.color;
    const reset = level === LogLevel.DEBUG ? "" : colors.reset;

    console.log(`${color}[Z-BLD-${id}] ${emoji}${message}${reset}`, ...args);
}

export function logError(id: string, message: string, ...args: any[]) {
    console.error(`${colors.red}${colors.bright}[Z-BLD-${id}] ❌ ${message}${colors.reset}`, ...args);
}

export async function copyFiles(sources: string[], destDir: string) {
    await mkdir(destDir, { recursive: true });
    await Promise.all(
        sources.map(async (src) => {
            const colonIndex = src.indexOf(":");
            let srcPath: string;
            let destPath: string;

            if (colonIndex !== -1) {
                srcPath = src.substring(0, colonIndex);
                destPath = join(destDir, src.substring(colonIndex + 1));
            } else {
                srcPath = src;
                destPath = join(destDir, src);
            }

            await cp(srcPath, destPath, { recursive: true });
        })
    );
}
