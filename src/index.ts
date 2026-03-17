#!/usr/bin/env bun

import { existsSync, readFileSync } from "fs";
import { parseArgs } from "util";
import { Config, Format, LinuxConfig, LogLevel, Os, OsConfig } from "./types";
import { log, logError } from "./utils";

const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
        help: {
            type: "boolean",
            short: "h"
        },
        config: {
            type: "string",
            short: "c",
            default: "zhiva-builder.json"
        },
        target: {
            type: "string",
            short: "t",
        },
        noArchive: {
            type: "boolean"
        },
        noFpm: {
            type: "boolean"
        }
    }
});

if (values.help)
    await import("./help");

log(LogLevel.INFO, "01-01", `Loading configuration from: ${values.config}`);

if (!existsSync(values.config)) {
    logError("01-02", "Config file not found");
    process.exit(1);
}

const config: Config = JSON.parse(readFileSync(values.config, "utf-8"));

if (values.target) {
    const targets = values.target.split(",");

    const fpmFormats = ["deb", "rpm", "pacman"];
    const archiveFormats = ["zip", "tar.gz", "tar.xz", "7z"];
    const systems = ["win", "linux", "darwin"];

    const systemsCfg: Record<Os, (string | true)[]> = {
        win32: [],
        linux: [],
        darwin: [],
    };

    const systemAliases: Record<string, Os> = {
        win: "win32",
        lnx: "linux",
        mac: "darwin",
    };

    for (const target of targets) {
        // If target is a system and format, add it to that system
        if (target.includes("-")) {
            const [os, format] = target.split("-");
            systemsCfg[systemAliases[os] || os].push(format);

        } else {
            // If target is an archive format, add it to all systems
            if (archiveFormats.includes(target)) {
                systemsCfg.win32.push(target);
                systemsCfg.linux.push(target);
                systemsCfg.darwin.push(target);

                // If target is an FPM format, add it to linux
            } else if (fpmFormats.includes(target)) {
                systemsCfg.linux.push(target);

                // If target is a system, enable it
            } else if (systems.includes(target)) {
                systemsCfg[target].push(true);

                // If target is an system alias, enable the aliased system
            } else if (systemAliases[target]) {
                systemsCfg[systemAliases[target]].push(true);
            }
        }
    }

    for (const os in systemsCfg) {
        const osCfg = systemsCfg[os as Os];

        if (osCfg.length === 0) {
            delete config[os];
            continue;
        }

        const fpm = osCfg.filter((f) => fpmFormats.includes(f as string)) as Format[];
        const archive = osCfg.filter((f) => archiveFormats.includes(f as string)) as Format[];

        config[os as Os] = {
            format: archive,
            fpm,
        } as OsConfig | LinuxConfig;
    }
}

if (values.noArchive) {
    log(LogLevel.INFO, "01-03", "Archive creation disabled");
    config.noArchive = true;
}

if (values.noFpm) {
    log(LogLevel.INFO, "01-04", "FPM packaging disabled");
    config.noFpm = true;
}

const { build } = await import("./build");
build(config, positionals);
