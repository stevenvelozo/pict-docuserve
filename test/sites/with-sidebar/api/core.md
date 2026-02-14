# Core API

## `Widget(options)`

Create a new Widget instance.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `options.name` | string | The widget name |
| `options.debug` | boolean | Enable debug mode |

**Returns:** `Widget` instance

## `widget.render()`

Render the widget to its destination.

**Returns:** `string` — the rendered HTML

## `widget.destroy()`

Clean up the widget and remove it from the DOM.

**Returns:** `void`
