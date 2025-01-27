// Add the event listener
let runtimeData


async function getCommandHistory() {
	let commandHistory = await figma.clientStorage.getAsync('PLUGMA_COMMAND_HISTORY');

	// If there's no history, initialize the commandHistory object
	if (!commandHistory) {
		commandHistory = {};
	}

	// Retrieve the previous command to return first
	const previousCommand = commandHistory.previousCommand || null;
	const previousInstanceId = commandHistory.previousInstanceId || null;

	// Set the current command as the new previous command for future retrievals
	commandHistory.previousCommand = runtimeData.command;
	commandHistory.previousInstanceId = runtimeData.instanceId;
	await figma.clientStorage.setAsync('PLUGMA_COMMAND_HISTORY', commandHistory);

	return { previousCommand, previousInstanceId };
}

async function getWindowSettings(options) {
	// Determine which command is running (dev or preview)
	const command = runtimeData.command;

	// Define default settings for both dev and preview commands
	const defaultDevSettings = {
		width: 300,
		height: 200,
		minimized: false,
		toolbarEnabled: false
	};

	const defaultPreviewSettings = {
		width: 300,
		height: 200,
		minimized: true,
		toolbarEnabled: true
	};



	// Define storage keys for dev and preview settings
	const storageKeyDev = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_DEV';
	const storageKeyPreview = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_PREVIEW';
	let pluginWindowSettings;

	if (command === "dev") {


		pluginWindowSettings = await figma.clientStorage.getAsync(storageKeyDev);


		// Get dev settings or set them if they don't exist
		if (!pluginWindowSettings) {
			await figma.clientStorage.setAsync(storageKeyDev, defaultDevSettings);
			pluginWindowSettings = defaultDevSettings;
		}
	} else if (command === "preview") {

		pluginWindowSettings = await figma.clientStorage.getAsync(storageKeyPreview);


		// Get preview settings or set them if they don't exist
		if (!pluginWindowSettings) {
			await figma.clientStorage.setAsync(storageKeyPreview, defaultPreviewSettings);
			pluginWindowSettings = defaultPreviewSettings;
		}
	}

	if (options && (!options.width || !options.height)) {
		pluginWindowSettings.height = 300
		pluginWindowSettings.width = 400

		if (pluginWindowSettings && pluginWindowSettings.toolbarEnabled) {
			pluginWindowSettings.height = 300 + 41
		}
	}

	return pluginWindowSettings;
}

async function setWindowSettings(pluginWindowSettings) {
	// Determine which command is running (dev or preview)
	const command = runtimeData.command;

	// Define storage keys for dev and preview settings
	const storageKeyDev = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_DEV';
	const storageKeyPreview = 'PLUGMA_PLUGIN_WINDOW_SETTINGS_PREVIEW';

	// Set the appropriate settings based on the command
	if (command === "dev") {
		await figma.clientStorage.setAsync(storageKeyDev, pluginWindowSettings);
	} else if (command === "preview") {
		await figma.clientStorage.setAsync(storageKeyPreview, pluginWindowSettings);
	}
}

function customResize(width, height) {

	getWindowSettings().then((pluginWindowSettings) => {

		// Check if the PLUGMA_MINIMIZE_WINDOW event was triggered
		if (pluginWindowSettings.minimized) {
			height = 40;
			width = 200
		}

		// Call the original figma.ui.resize method if it exists
		if (figma && figma.ui && typeof figma.ui.resize === 'function') {
			// To avoid Vite replacing figma.ui.resize and causing an infinite loop
			figma.ui['re' + 'size'](width, height);
		} else {
			console.warn('Figma UI resize method is not available.');
		}
	});
}

function customShowUI(htmlString, options) {

	options = options || {}

	// Show UI to receive messages
	let mergeOptions = Object.assign({ visible: false }, options)
	figma['show' + 'UI'](htmlString, mergeOptions);


	getCommandHistory().then((commandHistory) => {
		getWindowSettings(options).then((pluginWindowSettings) => {

			let hasCommandChanged = commandHistory.previousCommand !== runtimeData.command
			let hasInstanceChanged = commandHistory.previousInstanceId !== runtimeData.instanceId

			// FIXME: Modify this so that this triggers each time the preview command is used. Accomplish this because generating an instance id from the CLI
			// If new instance of command reset toolbar and minimized window

			// if (hasInstanceChanged && runtimeData.command === "preview") {
			if (runtimeData.command === "preview") {
				// Note: because we can't reliably show the UI with the position in the bottom left we reposition it each time the window opens (as well as the toolbar)
				pluginWindowSettings.minimized = true
				pluginWindowSettings.toolbarEnabled = true
				// NOTE: we override position because preview mode is very opinionated about how it's used and will reset the position each time the command is used
				// if (!options.position) {

				const zoom = figma.viewport.zoom;

				options.position = {
					x: figma.viewport.bounds.x + (12 / zoom),
					y: figma.viewport.bounds.y + (figma.viewport.bounds.height - ((80 + 12) / zoom))
					// y: figma.viewport.bounds.y + (0 + 12 / zoom)
				}

				// }

			}

			// NOTE: Because we can't get the last used window position, we reset it to the center when the user changes to dev
			if (hasCommandChanged && runtimeData.command === "dev") {
				const zoom = figma.viewport.zoom;

				if (!options.position) {
					options.position = {
						x: (figma.viewport.center.x - ((options.width / 2) / zoom)),
						// Remember to take into account height of plugin window toolbar which is 40px
						y: (figma.viewport.center.y - (((options.height + 41) / 2) / zoom))
					}
				}

			}

			if (hasInstanceChanged) {

				if (runtimeData.command === "preview") {

					pluginWindowSettings.toolbarEnabled = true
					pluginWindowSettings.minimized = true
				}

				// if (runtimeData.command === "dev") {
				// 	pluginWindowSettings.toolbarEnabled = false
				// 	pluginWindowSettings.minimized = false
				// }
			}

			if (options && options.height) {
				pluginWindowSettings.height = options.height
			}

			if (options && options.width) {
				pluginWindowSettings.width = options.width
			}


			if (pluginWindowSettings.toolbarEnabled) {
				options.height = pluginWindowSettings.height + 41
			}

			// Check if the PLUGMA_MINIMIZE_WINDOW event was triggered
			if (pluginWindowSettings.minimized) {

				options = options || {}

				// Check if the options object exists and if it has a height property
				if (options.height && options.width) {
					// Override the height property
					options.height = 40;
					options.width = 200;
				}
			}



			// if (figma && figma.showUI && typeof figma.showUI === 'function') {




			// Only resize if width and height provided
			if (options.width && options.height) {
				figma.ui['re' + 'size'](options.width, options.height)
			}


			// If width and height not provided and toolbarEnabled, resize to account for toolbar
			if ((!options.width || !options.height) && pluginWindowSettings.toolbarEnabled) {
				figma.ui['re' + 'size'](300, 200 + 41)
			}
			if ((!options.width || !options.height) && !pluginWindowSettings.toolbarEnabled) {
				figma.ui['re' + 'size'](300, 200)
			}

			// Reposition UI
			if (options.position && options.position.x && options.position.y) {
				figma.ui.reposition(options.position.x, options.position.y)
			}

			figma.ui.postMessage(
				{ event: 'PLUGMA_PLUGIN_WINDOW_SETTINGS', data: pluginWindowSettings }
			)

			// Don't show the UI if user set to false
			if (options.visible !== false) {
				figma.ui.show()
			}

			// } else {
			// 	console.warn('Figma showUI method is not available.');
			// }

			setWindowSettings(pluginWindowSettings)
		})
	})

}

figma.ui.on('message', async (message) => {
	// Check if the message type is "PLUGMA_MINIMISE_WINDOW"


	if (message.event === 'PLUGMA_HIDE_TOOLBAR') {
		getWindowSettings().then((pluginWindowSettings) => {
			pluginWindowSettings.toolbarEnabled = false;
			figma.ui['re' + 'size'](pluginWindowSettings.width, pluginWindowSettings.height)
			setWindowSettings(pluginWindowSettings)
		})
	}

	if (message.event === 'PLUGMA_MINIMISE_WINDOW') {
		getWindowSettings().then((pluginWindowSettings) => {
			pluginWindowSettings.minimized = true;
			figma.ui['re' + 'size'](200, 40)
			setWindowSettings(pluginWindowSettings)
		})
	}
	if (message.event === 'PLUGMA_MAXIMISE_WINDOW') {
		getWindowSettings().then((pluginWindowSettings) => {
			pluginWindowSettings.minimized = false;

			figma.ui['re' + 'size'](pluginWindowSettings.width, pluginWindowSettings.height + 41)
			setWindowSettings(pluginWindowSettings)
		})

	}

	if (message.event === 'PLUGMA_SAVE_PLUGIN_WINDOW_SETTINGS') {
		getWindowSettings().then((pluginWindowSettings) => {
			// FIXME: For not only set it if data received. Really need a env variable so this event is not even posted by Plugin Window
			if (message.data.height) {
				if (message.data.toolbarEnabled) {
					// message.data.height = message.data.height + 40
					figma.ui['re' + 'size'](message.data.width, message.data.height + 41)
				}
				else {
					// message.data.height = message.data.height - 40
					figma.ui['re' + 'size'](message.data.width, message.data.height - 41)
				}
				let mergedOptions = Object.assign(pluginWindowSettings, message.data)
				setWindowSettings(mergedOptions)
			}
		})
	}

	if (message.event === "PLUGMA_DELETE_ROOT_PLUGIN_DATA") {
		let pluginDataKeys = figma.root.getPluginDataKeys();
		for (let i = 0; i < pluginDataKeys.length; i++) {
			let key = pluginDataKeys[i];
			figma.root.setPluginData(key, "");
			console.log(`[plugma] ${key} deleted from root pluginData`);
		}
		figma.notify("Root pluginData deleted");
	}

	if (message.event === "PLUGMA_DELETE_CLIENT_STORAGE") {
		let clientStorageKeys = await figma.clientStorage.keysAsync();
		for (let i = 0; i < clientStorageKeys.length; i++) {
			let key = clientStorageKeys[i];
			if (key !== "figma-stylesheet") {
				await figma.clientStorage.deleteAsync(key);
				console.log(`[plugma] ${key} deleted from clientStorage`);
			}
		}
		figma.notify("ClientStorage deleted");
	}
});
