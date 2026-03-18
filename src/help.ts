const helpText = `
Zhiva Builder - Bundler and Packager for Zhiva Apps

USAGE:
  zhiva-builder [options]

OPTIONS:
  -h, --help              Show this help message
  -c, --config <path>     Path to config file (default: zhiva-builder.yaml)
  -t, --target <targets>  Comma-separated list of build targets
                          Systems: linux (lnx), win32 (win), darwin (mac)
                          FPM formats: deb, rpm, pacman (Linux only)
                          Archive formats: zip, tar.gz, tar.xz, 7z
                          Combined targets: <system>-<format> (e.g. lnx-deb, win-zip)
  --no-archive            Skip archive creation, keep unpacked build
  --no-fpm                Skip FPM packaging (deb, rpm, pacman)
`;

console.log(helpText.trim() + "\n");
process.exit(0);

export { }
