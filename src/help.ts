const helpText = `
Zhiva Builder - Bundler and Packager for Zhiva Apps

USAGE:
  zhiva-builder [options]

OPTIONS:
  -h, --help              Show this help message
  -c, --config <path>     Path to config file (default: zhiva-builder.json)
  -t, --target <systems>  Comma-separated list of target systems
                          Available: linux, win, darwin
  --no-archive            Skip archive creation, keep unpacked build
  --no-fpm                Skip FPM packaging (deb, rpm, pacman)
`;

console.log(helpText.trim() + "\n");
process.exit(0);

export { }
