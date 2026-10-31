# Zhiva Builder

Zhiva app builder and packager.

## Installation

```bash
ingr Zhiva-builder
```

or

```bash
bunx @wxn0brp/ing i Zhiva-builder
```

or

```bash
git clone https://github.com/wxn0brP/Zhiva-builder.git
cd Zhiva-builder
bun install
# Add to $PATH the src/index.ts file as zhiva-builder.
```

### Options

[Zhiva Builder Help](https://github.com/wxn0brP/Zhiva-builder/blob/master/src/help.ts)

## Config

See `zhiva-builder.example.yaml` for configuration example.

The configuration schema is available in [`schema.json`](./schema.json).

### VSC Lint

```json
"yaml.schemas": {
    "https://raw.githubusercontent.com/wxn0brP/Zhiva-builder/refs/heads/master/schema.json": [
        "zhiva-builder.yaml"
    ]
}
```

## License

MIT
