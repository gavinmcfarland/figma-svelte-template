import React from 'react'
import ReactDOM from 'react-dom/client'

export function mount(App) {
	// biome-ignore lint/style/noNonNullAssertion:
	ReactDOM.createRoot(document.getElementById('app')!).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>,
	)
}
