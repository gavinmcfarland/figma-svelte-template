<script>
	import { nanoid } from 'nanoid'
	import ServerStatus from './lib/ServerStatus.svelte'
	import { monitorUrl } from '../../shared/monitorUrl'
	import { setBodyStyles } from '../../shared/setBodyStyles'
	import { redirectIframe } from '../../shared/redirectIframe'
	import { resizePluginWindow } from '../../shared/resizePluginWindow'
	import { setupWebSocket } from '../../shared/setupWebSocket'

	import { onMount, tick } from 'svelte'
	import { isDeveloperToolsActive, isLocalhostWithoutPort, pluginWindowSettings } from '../../shared/stores'
	import Toolbar from './lib/Toolbar.svelte'
	import { triggerDeveloperTools } from '../../shared/triggerDeveloperTools'
	import { monitorDeveloperToolsStatus } from '../../shared/monitorDeveloperToolsStatus'

	let iframe
	const html = document.querySelector('html')

	// @ts-ignore
	let url = `http://localhost:${window.runtimeData.port}`

	let isServerActive = true

	// Pass messages between parent and plugin window wrapper iframe
	function relayFigmaMessages(ws) {
		// window.addEventListener('message', (event) => {
		// 	console.log('------- iiii', event.data)
		// })
		ws.on((event) => {
			if (event.origin === 'https://www.figma.com') {
				// forward to iframe and browser
				ws.post(event.data, ['iframe', 'ws'])
			} else {
				// forward to main
				ws.post(event.data, ['parent'])
			}
		}, 'window')

		ws.on((event) => {
			// TODO: Filter out messages sent by framework
			ws.post(event.data, 'parent')
		}, 'ws')
	}

	function getClassesAndStyles(ws) {
		const styleSheetElement = document.getElementById('figma-style')

		ws.on((event) => {
			const message = event.data.pluginMessage

			if (message.type === 'GET_FIGMA_CLASSES_AND_STYLES') {
				const messages = [
					{
						pluginMessage: {
							type: 'FIGMA_HTML_CLASSES',
							data: html.className,
						},
					},
					{
						pluginMessage: {
							type: 'FIGMA_STYLES',
							data: styleSheetElement.innerHTML,
						},
					},
				]
				ws.post(messages, ['iframe', 'ws'])
			}
		}, 'ws')
	}

	function observeChanges(ws) {
		function postMessage(type, data) {
			ws.post(
				{
					pluginMessage: {
						type,
						data,
					},
					pluginId: '*',
				},
				['iframe', 'ws'],
			)
		}

		function createObserver(target, messageType, getData) {
			// Post initial data
			postMessage(messageType, getData())

			const observer = new MutationObserver(() => {
				postMessage(messageType, getData())
			})

			observer.observe(target, {
				attributes: true,
				childList: true,
				subtree: true,
			})
		}

		const styleSheetElement = document.getElementById('figma-style')
		createObserver(html, 'FIGMA_HTML_CLASSES', () => html.className)
		createObserver(styleSheetElement, 'FIGMA_STYLES', () => styleSheetElement.innerHTML)
	}

	onMount(async () => {
		// NOTE: Messaging must be setup first so that it's ready to receive messages from iframe
		let ws = setupWebSocket(iframe, window.runtimeData.websockets)

		// Move redirecting iframe higher up because some messages were not being recieved due to iframe not being redirected in time (do i need to consider queing messages?)
		iframe.src = new URL(url).href
		relayFigmaMessages(ws)

		monitorUrl(url, iframe, (isActive) => {
			isServerActive = isActive
		})
		setBodyStyles()
		await monitorDeveloperToolsStatus()
		await triggerDeveloperTools()
		// redirecting iframe used to be here
		// await redirectIframe(iframe, url)

		// Needs to occur without waiting for websocket to open
		observeChanges(ws)

		ws.open(() => {
			// observeChanges(ws)
			getClassesAndStyles(ws)
		})
	})
</script>

{#if $isDeveloperToolsActive}
	<Toolbar />
{/if}

<iframe title="" id="vite-app-host" bind:this={iframe}></iframe>

<!-- needs to be in both PluginWindow and ViteApp, because if ViteApp hasn't loaded, then no way to report error-->
{#if $isLocalhostWithoutPort}
	<ServerStatus message="Check dev console"></ServerStatus>
{:else if !isServerActive}
	<ServerStatus></ServerStatus>
{/if}

<style>
	#vite-app-host {
		width: 100%;
		/* height: 100vh; */
		flex-grow: 1;
		border: none;
	}
</style>
