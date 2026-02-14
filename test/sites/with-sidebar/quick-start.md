# Quick Start

Get up and running in under five minutes.

## Step 1: Create a project

```bash
mkdir my-project && cd my-project
npm init -y
npm install example-lib
```

## Step 2: Write your first script

```javascript
const { Widget } = require('example-lib');

let tmpWidget = new Widget({ name: 'Hello' });
tmpWidget.render();
```

## Step 3: Run it

```bash
node index.js
```

You should see output in your terminal.
