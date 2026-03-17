#!/usr/bin/env bun

import { parseArgs } from "util";
import { Config } from "./types";
import { readFileSync } from "fs";

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

const config: Config = JSON.parse(readFileSync(values.config, "utf-8"));

if (values.target) {
    const systems = values.target.split(",");
    if (!systems.includes("linux")) delete config.linux;
    if (!systems.includes("win")) delete config.win32;
    if (!systems.includes("darwin")) delete config.darwin;
}

if (values.noArchive)
    config.noArchive = true;

if (values.noFpm)
    config.noFpm = true;

const { build } = await import("./build");
build(config, positionals);
