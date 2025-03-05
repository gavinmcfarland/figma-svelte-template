<script lang="ts">
	interface Props {
        children: () => any;
        href?: string;
        target?: string;
        style?: string;
        onclick?: () => void;
	}

	let { children, href, target, style, onclick }: Props = $props()
</script>

{#if href}
	<a class="Button" {href} {target} {style} {onclick}>{@render children()}</a>
{:else}
	<button class="Button" {style} {onclick}>
		{@render children()}
	</button>
{/if}

<style>
	.Button {
		display: block;
		border-radius: 5px;
		border: 1px solid var(--figma-color-border);
		padding: 0 7px;
		line-height: 22px;
		text-decoration: none;
		color: var(--figma-color-text);
	}
</style>
