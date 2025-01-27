<script lang="ts">
	let { value = $bindable(''), type = 'text', showIcon } = $props()
</script>

<div class="Input" data-non-interactive="true">
	<div class="displayContents">
		<label
			data-tooltip-type="text"
			data-tooltip="X-position"
			aria-label="X-position"
			data-onboarding-key="scrubbable-control-x-position"
			data-temporary-fpl-no-drag=""
		>
			{#if showIcon}
				<span class="icon"><i18n-text>X</i18n-text></span>
			{/if}
			<input {type} spellcheck="false" dir="auto" bind:value /></label
		>
	</div>
</div>

<style>
	.displayContents {
		display: contents;
	}
	.icon {
		display: flex;
		align-items: center;
		justify-content: center;
		height: var(--spacer-4);
		width: var(--spacer-4);
		flex: 0 0 var(--spacer-4);
		line-height: var(--spacer-4);
		stroke: unset;

		color: var(--figma-color-icon-secondary);
		margin-left: -1px;
		vertical-align: top;
		text-transform: none !important;
		-moz-osx-font-smoothing: grayscale;
		-webkit-font-smoothing: antialiased;
		text-align: center;
		pointer-events: none;
		line-height: var(--spacer-4);
		letter-spacing: inherit;
		text-decoration: none;
		font-weight: 400;
		margin-right: -8px;
	}
	label {
		margin: 1px 0;
		display: flex;
		background-color: var(--figma-color-bg-secondary);
		border: 1px solid transparent;
		height: var(--spacer-4);
		border-radius: var(--radius-medium);
		align-items: center;
	}

	label:hover {
		border-color: var(--figma-color-border);
	}

	label:focus-within {
		border-color: var(--figma-color-border-selected);
		border-width: 1px;
	}

	input {
		height: var(--spacer-4);
		display: flex;
		margin: 0;
		padding: 0 7px;
		border: 1px solid transparent;
		border-left: 0;
		border-right: 0;
		background-clip: padding-box;
		margin-left: 0;
		width: 100%;
	}

	input:focus-visible {
		outline: unset;
	}

	input[type='number']::-webkit-inner-spin-button,
	input[type='number']::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	/* For Firefox */
	input[type='number'] {
		-moz-appearance: textfield;
	}
</style>
