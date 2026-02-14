# API Reference

## `App(config)`

Create a new application instance.

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `config.name` | string | `"app"` | Application name |
| `config.port` | number | `3000` | Port to listen on |
| `config.debug` | boolean | `false` | Enable debug logging |

### Methods

#### `app.start()`

Start the application server.

```javascript
const app = new App({ port: 8080 });
app.start();
```

#### `app.stop()`

Gracefully shut down the application.

```javascript
await app.stop();
```

#### `app.use(plugin)`

Register a plugin with the application.

```javascript
app.use(myPlugin);
```
