import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { Format, LogLevel } from "./types";
import { log } from "./utils";

export function createArchive(tempDir: string, type: Format, destDir: string, appName: string, os: string) {
    const out = join(resolve(destDir), appName + "-" + os + "." + type);
    let cmd = "";

    switch (type) {
        case "zip":
            cmd = `zip -rq ${out} ${appName}`;
            break;
        case "tar.gz":
            cmd = `tar -zcvf ${out} ${appName}`;
            break;
        case "tar.xz":
            cmd = `tar -Jcvf ${out} ${appName}`;
            break;
        case "7z":
            cmd = `7z a ${out} ${appName}`;
            break;
    }

    log(LogLevel.DEBUG, "03-01", `Run: ${cmd}`);

    execSync(cmd, {
        shell: "bash",
        cwd: join(tempDir, "..")
    });
}

export function createArchives(
    tempDir: string,
    formats: Format[],
    os: string,
    appName: string
) {
    log(LogLevel.IMPORTANT, "03-02", `Creating archives for ${os}: ${formats.join(", ")}`);

    const archivesDir = join(tempDir, "..", "..", "archives");

    if (!existsSync(archivesDir))
        mkdirSync(archivesDir, { recursive: true });

    for (const format of formats)
        createArchive(tempDir, format, archivesDir, appName, os);

    log(LogLevel.IMPORTANT, "03-03", `Archive creation completed for ${os}`);
}
