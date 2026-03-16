const helpText = `
Zhiva-builder

Build and package your application for multiple platforms (Linux, Windows, macOS).

USAGE:
  bun run src/index.ts [options]

OPTIONS:
  -h, --help              Show this help message
  -c, --config <path>     Path to config file (default: zhiva-builder.json)
  -t, --target <systems>  Comma-separated list of target systems
                          Available: linux, win, darwin
  --no-archive            Skip archive creation, keep unpacked build
`;

console.log(helpText);
process.exit(0);

export { }
