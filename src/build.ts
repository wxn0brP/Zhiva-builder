import { type Build } from "bun";
import { execFileSync, execSync } from "child_process";
import {
	copyFileSync,
	existsSync,
	statSync,
	unlinkSync,
	writeFileSync,
} from "fs";
import { join } from "path";
import { createArchives } from "./archive";
import { checkEngines, getEngineFilePath } from "./engine";
import { createFpmPackages } from "./fpm";
import { Arch, CompileConfig, Config, LogLevel, Os } from "./types";
import { copyFiles, log, logError, normalizeAppId } from "./utils";
import { packageJson, zhivaConfig } from "./vars";

export async function build(config: Config) {
	log(LogLevel.CRITICAL, "02-01", "Starting build process...");

	if (config.build.cmd) {
		log(LogLevel.INFO, "02-02", `Running build command: ${config.build.cmd}`);
		execSync(config.build.cmd, {
			shell: "bash",
		});
	}

	await checkEngines(config);
	await buildBackend(config);

	if (config.linux) await buildForSystem(config, "linux");
	if (config.win32) await buildForSystem(config, "win32");
	if (config.darwin) await buildForSystem(config, "darwin");

	if (config.linux?.fpm?.length && !config.noFpm) createFpmPackages(config);

	log(LogLevel.CRITICAL, "02-03", "Build process completed");
}

async function buildBackend(config: Config) {
	log(LogLevel.CRITICAL, "02-04", "Building backend...");

	await Bun.build({
		entrypoints: [
			packageJson.main,
		],
		target: "bun",
		naming: "zhiva-index.js",
		minify: true,
		outdir: config.output.dir,
	}).catch(e => {
		logError("02-05", "Error building backend:", e);
		process.exit(1);
	});

	const appId = config.id || zhivaConfig.name;
	if (!appId) {
		logError("02-06", "Error building backend: app id or name is not found");
		process.exit(1);
	}

	const env = {
		ZHIVA_ROOT: "./",
		ZHIVA_ASSETS: "./assets",
		ZHIVA_APP_ID: normalizeAppId(appId + ".portable.zhiva.local"),
		NODE_ENV: "production",
		...(config.env || {}),
	};

	writeFileSync(
		join(config.output.dir, "zhiva-index-bun.js"),
		`const i = "./zhiva-index.js";
${Object.entries(env)
	.map(([k, v]) => `process.env['${k}'] = ${JSON.stringify(v)};`)
	.join("\n")}
import(i);`,
		"utf-8",
	);

	log(LogLevel.CRITICAL, "02-06", "Backend built successfully");
}

async function buildForSystem(config: Config, os: Os) {
	log(LogLevel.CRITICAL, "02-07", `Building for ${os}...`);

	const tempDir = join(config.output.dir, os, config.output.name);

	log(LogLevel.DEBUG, "02-08", `Copying files to ${tempDir}`);
	await copyFiles(config.files, tempDir);
	await copyFiles(
		[
			join("node_modules", "@wxn0brp", "zhiva-base-lib", "assets") + ":assets",
		],
		tempDir,
	);
	copyFileSync(
		join(config.output.dir, "zhiva-index.js"),
		join(tempDir, "zhiva-index.js"),
	);

	const osConfig = config[os];

	if (osConfig.cmd) {
		log(LogLevel.INFO, "02-09", `Running ${os} command: ${osConfig.cmd}`);
		execSync(osConfig.cmd, {
			shell: "bash",
		});
	}

	await buildBin(config, tempDir, os);

	const zhivaEnginePath = getEngineFilePath(config, os);
	log(LogLevel.DEBUG, "02-10", `Copying Zhiva engine to ${tempDir}`);
	copyFileSync(
		zhivaEnginePath,
		join(tempDir, `zhiva${os === "win32" ? ".exe" : ""}`),
	);

	if (!config.noArchive)
		createArchives(tempDir, osConfig.format, os, config.output.name);

	log(LogLevel.CRITICAL, "02-11", `Build for ${os} completed`);
}

const binExt: Record<Os, string> = {
	win32: ".exe",
	darwin: "-macos",
	linux: ".x86_64",
};

const defaultArch: Record<Os, Arch> = {
	win32: "x64",
	darwin: "arm64",
	linux: "x64",
};

function getBinExt(os: Os, arch: Arch) {
	if (os === "linux" && arch !== "x64") return `-linux-${arch}`;
	return binExt[os];
}

const hostOs: Os | null =
	process.platform === "win32"
		? "win32"
		: process.platform === "darwin"
			? "darwin"
			: process.platform === "linux"
				? "linux"
				: null;

const hostArch: Arch | null =
	process.arch === "x64" || process.arch === "arm64" ? process.arch : null;

let buildHelp: string | undefined;

function bunBuildSupports(flag: string) {
	buildHelp ??= execFileSync(
		process.execPath,
		[
			"build",
			"--help",
		],
		{
			encoding: "utf-8",
		},
	);
	return buildHelp.includes(flag);
}

function getCompileOptions(
	config: CompileConfig | undefined,
	os: Os,
	arch: Arch,
) {
	const options: Record<string, unknown> = {};
	const cfg = config ?? {};
	const isHostTarget = os === hostOs && arch === hostArch;

	const trim = cfg.trim ?? true;
	const aot = cfg.aot ?? true;

	if (!isHostTarget) {
		const skipped = [
			trim ? "trim" : null,
			aot ? "aot" : null,
		].filter(Boolean);

		if (skipped.length)
			log(
				LogLevel.IMPORTANT,
				"02-13",
				`${skipped.join(" and ")} only available for the host target (${hostOs}/${hostArch}), skipping for ${os}/${arch}`,
			);
	}

	if (trim && isHostTarget) {
		if (!bunBuildSupports("--trim"))
			log(
				LogLevel.IMPORTANT,
				"02-12",
				"Compile trim requires Bun canary, ignoring (current Bun does not support --trim)",
			);
		else options.trim = trim;
	}

	if (aot && isHostTarget) {
		if (!bunBuildSupports("--aot")) {
			log(
				LogLevel.IMPORTANT,
				"02-14",
				"AOT compiling requires Bun canary, ignoring (current Bun does not support --aot)",
			);
		} else {
			options.aot = true;
			options.functionSource = cfg.functionSource ?? false;
			options.obfuscate = cfg.obfuscate ?? true;
		}
	}

	return options;
}

async function buildBin(config: Config, tempDir: string, os: Os) {
	const arch = config[os].arch ?? defaultArch[os];
	const target = `bun-${os}-${arch}` as Build.CompileTarget;
	const bin = join(
		tempDir,
		zhivaConfig.name.replace(" ", "-") + getBinExt(os, arch),
	);

	log(LogLevel.INFO, "02-09", `Building binary for ${os}/${arch}: ${bin}`);

	await Bun.build({
		entrypoints: [
			join(config.output.dir, "zhiva-index-bun.js"),
		],
		compile: {
			outfile: bin,
			target,
			...getCompileOptions(config.compile, os, arch),
		} as Bun.CompileBuildOptions,
	}).catch(e => {
		logError("02-09", `Error building binary for ${os}:`, e);
		process.exit(1);
	});

	for (const ext of [
		".map",
		".map.js",
	]) {
		const map = bin + ext;
		if (existsSync(map)) {
			unlinkSync(map);
			log(LogLevel.DEBUG, "02-16", `Removed source map: ${map}`);
		}
	}

	const size = statSync(bin).size;
	log(
		LogLevel.INFO,
		"02-15",
		`Binary built successfully: ${bin} (${(size / 1024 / 1024).toFixed(1)} MB)`,
	);
}
