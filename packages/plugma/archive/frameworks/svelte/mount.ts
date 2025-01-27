function mount(App) {
	let app
	app = new App({
		target: document.getElementById('app')!,
	})

	return app
}

export { mount }
