export type Os = "win32" | "darwin" | "linux";
export type Format = "zip" | "tar.gz" | "tar.xz" | "7z";
export type FpmFormat = "deb" | "rpm" | "pacman";

export interface OsConfig {
    format: Format[];
    cmd?: string;
}

export interface LinuxConfig extends OsConfig {
    fpm?: FpmFormat[];
}

export interface Config {
    build: {
        cmd: string;
    };
    files: string[];
    output: {
        name: string;
        dir: string;
    };
    linux: LinuxConfig;
    win32: OsConfig;
    darwin: OsConfig;

    // internal
    noArchive: boolean;
    noFpm: boolean;
}

export interface ZhivaConfig {
    name: string;
    main: string;
}

export enum LogLevel {
    CRITICAL = 0,
    IMPORTANT = 1,
    INFO = 2,
    DEBUG = 3
}

export type LevelConfig = Record<LogLevel, {
    color: string;
    emoji?: string;
}>;
