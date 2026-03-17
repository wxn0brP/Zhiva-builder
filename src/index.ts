#!/usr/bin/env bun

import { readFileSync } from "fs";
import { parseArgs } from "util";
import { Config, LogLevel } from "./types";
import { log } from "./utils";

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

const config: Config = JSON.parse(readFileSync(values.config, "utf-8"));

if (values.target) {
    const systems = values.target.split(",");
    log(LogLevel.IMPORTANT, "01-02", `Filtering targets to: ${systems.join(", ")}`);
    if (!systems.includes("linux")) delete config.linux;
    if (!systems.includes("win")) delete config.win32;
    if (!systems.includes("darwin")) delete config.darwin;
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
