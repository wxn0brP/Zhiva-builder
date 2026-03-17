import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { Config, FpmFormat, LogLevel } from "./types";
import { log } from "./utils";

function createFpmPackage(config: Config, rootDir: string, format: FpmFormat) {
    const { name: appName, dir: releasesDir } = config.output;

    const output = join(releasesDir, "archives", `${appName}.${getFileExtension(format)}`);

    const cmd = `fpm -s dir -t ${format} -n ${appName} -p ${output} ${rootDir}=/opt/zhiva`;

    log(LogLevel.DEBUG, "06-01", `Run fpm: ${cmd}`);

    execSync(cmd, {
        shell: "bash"
    });
}

function getFileExtension(format: FpmFormat) {
    switch (format) {
        case "pacman":
            return "pkg.tar.zst";
        default:
            return format;
    }
}

export function createFpmPackages(config: Config) {
    log(LogLevel.IMPORTANT, "06-02", "Starting FPM package creation...");

    const rootDir = join(config.output.dir, "linux", config.output.name);

    const archiveDir = join(config.output.dir, "archives");
    if (!existsSync(archiveDir))
        mkdirSync(archiveDir, { recursive: true });

    for (const format of config.linux.fpm)
        createFpmPackage(config, rootDir, format);

    log(LogLevel.IMPORTANT, "06-03", "FPM package creation completed");
}
