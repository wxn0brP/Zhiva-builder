# Zhiva Builder

Zhiva app builder and packager.

## Usage

```bash
bun src/index.ts [options]
```

### Options

- `-h, --help` - Show help
- `-c, --config <path>` - Config file (default: `zhiva-builder.json`)
- `-t, --target <systems>` - Target platforms: `linux`, `win`, `darwin` (comma-separated)
- `--no-archive` - Skip archive creation

### Examples

```bash
bun src/index.ts ./my-app
bun src/index.ts -c custom-config.json ./my-app
bun src/index.ts -t linux,win ./my-app
```

## Config

See `zhiva-builder.example.json` for configuration example.

## License

MIT
