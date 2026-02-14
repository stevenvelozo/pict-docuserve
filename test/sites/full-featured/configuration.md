# Configuration

Create a `.config.json` in your project root:

```json
{
  "name": "my-project",
  "features": {
    "search": true,
    "sidebar": true
  }
}
```

## Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `name` | string | `""` | Project name |
| `features.search` | boolean | `false` | Enable search |
| `features.sidebar` | boolean | `true` | Enable sidebar |
