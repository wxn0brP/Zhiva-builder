import { mkdir, cp } from "fs/promises";
import { basename, join } from "path";

export async function copyFiles(sources: string[], destDir: string) {
    await mkdir(destDir, { recursive: true });
    await Promise.all(
        sources.map((src) => cp(src, join(destDir, basename(src)), { recursive: true }))
    );
}
