<script lang="ts">
	export let size = 16
	export let svg
</script>

{#if svg === 'plugma'}
	<svg width={size + 'px'} height={size + 'px'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g clip-path="url(#clip0_1508_4907)">
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M4.8 0C2.14903 0 0 2.14903 0 4.8V19.2C0 21.8509 2.14903 24 4.8 24H19.2C21.8509 24 24 21.8509 24 19.2V4.8C24 2.14903 21.8509 0 19.2 0H4.8ZM4.8 14.4H8.4C9.06274 14.4 9.6 14.9372 9.6 15.6V16.8C9.6 17.4628 9.06274 18 8.4 18H4.8C4.13726 18 3.6 17.4628 3.6 16.8V15.6C3.6 14.9372 4.13726 14.4 4.8 14.4ZM19.2 14.4H15.6C14.9372 14.4 14.4 14.9372 14.4 15.6V16.8C14.4 17.4628 14.9372 18 15.6 18H19.2C19.8628 18 20.4 17.4628 20.4 16.8V15.6C20.4 14.9372 19.8628 14.4 19.2 14.4ZM11.4 4.8H12.6C13.2628 4.8 13.8 5.33726 13.8 6V9.6C13.8 10.2628 13.2628 10.8 12.6 10.8H11.4C10.7372 10.8 10.2 10.2628 10.2 9.6V6C10.2 5.33726 10.7372 4.8 11.4 4.8Z"
				fill="currentColor"
			/>
		</g>
		<defs>
			<clipPath id="clip0_1508_4907">
				<rect width="24" height="24" fill="white" />
			</clipPath>
		</defs>
	</svg>
{/if}

{#if svg === 'plus'}
	<svg width={size + 'px'} height={size + 'px'} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
		<g opacity="0.3">
			<path d="M12 5V19Z" fill="white" />
			<path
				d="M12 5V19"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path d="M19 12H5Z" fill="white" />
			<path
				d="M19 12H5"
				stroke="currentColor"
				stroke-width="1.5"
				stroke-miterlimit="10"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</g>
	</svg>
{/if}
