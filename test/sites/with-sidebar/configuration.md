# Configuration

Configuration is loaded from a `.examplerc.json` file in your project root.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | `"default"` | The project name |
| `debug` | boolean | `false` | Enable debug logging |
| `port` | number | `3000` | Server port |
| `output` | string | `"./dist"` | Output directory |

## Example

```json
{
  "name": "my-project",
  "debug": true,
  "port": 8080,
  "output": "./build"
}
```
