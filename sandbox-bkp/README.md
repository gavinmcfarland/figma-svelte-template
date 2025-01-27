# plugma-sandbox

## Quickstart

This plugin was created with [Plugma](https://github.com/gavinmcfarland/plugma) using the [Svelte](https://svelte.dev/) framework.

### Requirements

-   [Node.js](https://nodejs.org/en)
-   [Figma desktop app](https://www.figma.com/downloads/)

### Install and Import

1. Install the dependencies and watch for changes while developing:

    ```bash
    npm install
    npm run dev
    ```

2. Open the Figma desktop app and import the plugin:

    - Open a file in Figma.
    - Search for "Import plugin from manifest..." using the [Quick Actions](https://help.figma.com/hc/en-us/articles/360040328653-Use-shortcuts-and-quick-actions#Use_quick_actions) bar.
    - Choose the `manifest.json` file from the `dist` folder.

3. Manage `manifest` details from inside `package.json`.

### Browser Preview

Run this command to preview your plugin in the browser during development.

```bash
npm run preview
```

_Make sure the plugin is open in the Figma desktop app._

### Before Publishing

Before publishing your plugin, make sure to create a build. If not, it will still point to the dev server and won't work properly for users.

```bash
npm run build
```

Now you can publish the plugin from the Figma desktop app.

### Advanced

See the [Plugma docs](https://plugma.dev/docs) for further information.
