import { readFileSync } from "fs";

export const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
export const zhivaConfig = JSON.parse(readFileSync("zhiva.json", "utf-8"));
