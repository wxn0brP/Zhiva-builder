export type Os = "win32" | "darwin" | "linux";
export type Format = "zip" | "tar.gz" | "tar.xz" | "7z";

export interface OsConfig {
    format: Format[];
    cmd?: string;
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
    linux: OsConfig;
    win32: OsConfig;
    darwin: OsConfig;

    // internal
    noArchive: boolean;
}

export interface ZhivaConfig {
    name: string;
    main: string;
}
