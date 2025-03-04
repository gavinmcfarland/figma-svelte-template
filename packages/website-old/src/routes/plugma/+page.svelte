<script>
	import Button from '@/components/Button.svelte'
	import Card from '@/components/Card.svelte'
	import Code from '@/components/Code.svelte'
	import Icon from '@/components/Icon.svelte'
	import Section from '@/components/Section.svelte'
	import { notifications } from '@/stores'
	import Notification from '@/components/Notification.svelte'
</script>

<div>
	<!-- <pre><button style="background: red; display: inline-block">
		<Icon svg="copy" />
	</button></pre> -->
	<!-- Navigation -->
	<nav class="p-4 pr-5 flex justify-between items-center border-b sticky top-0 backdrop-blur-lg">
		<div class="flex items-center gap-3">
			<Icon svg="terminal-filled" size={20} strokeWidth={1.5} />
			<span>Plugma</span>
		</div>
		<div class="flex gap-6">
			<a href="/docs" class="hover:underline">Docs</a>
			<a href="https://github.com/yourusername/plugma" class="hover:underline" target="_blank">GitHub</a>
		</div>
	</nav>

	<Section class="border-t-0 text-primary">
		<div class="max-w-6xl mx-auto">
			<div class="text-center">
				<h1 class="text-5xl/tight md:text-7xl/tight text-center font-medium mb-6">
					Create Figma plugins <br />without the boilerplate
				</h1>
				<p class="mb-6">Supports React, Svelte, Vue, and JavaScript</p>
				<Code class="max-w-fit mx-auto" persistCopyButton lang="js" text="npm create plugma@latest" />
				<Button>Get started</Button>
			</div>
		</div>
	</Section>

	<Section>
		<h2 class="text-4xl sm:text-4xl text-center font-medium mb-8">Features</h2>

		<div class="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
			<Card>
				<Icon svg="bolt" size={48} strokeWidth={1.1} />
				<h2 class="text-lg font-medium">Faster development</h2>
				<p>
					Accelerates development and improves debugging by eliminating the need to rebuild for every change.
				</p>
			</Card>

			<Card>
				<Icon svg="window" size={48} strokeWidth={1.1} />
				<h2 class="text-lg font-medium">Browser preview</h2>
				<p>
					Preview in any browser during development using websockets to pass messages from figma to the
					browser.
				</p>
			</Card>

			<Card>
				<Icon svg="vite-logo" size={48} strokeWidth={1.1} />
				<h2 class="text-lg font-medium">Built with Vite</h2>
				<p>
					Built using Vite, it works seamlessly with most frameworks and offers support for numerous Vite and
					Rollup plugins.
				</p>
			</Card>
		</div>
	</Section>

	<Section>
		<h2 class="text-4xl text-center font-medium mb-12">Commands</h2>
		<div class="lg:max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
			<div>
				<h4 class="font-bold mb-2">Start dev server</h4>
				<Code lang="js" text="dev" />
			</div>
			<div>
				<h4 class="font-bold mb-2">Create a build</h4>
				<Code lang="js" text="build" />
			</div>
			<div>
				<h4 class="font-bold mb-2">Preview in any browser</h4>
				<Code lang="js" text="preview" />
			</div>
			<div>
				<h4 class="font-bold mb-2">Release to github</h4>
				<Code lang="js" text="release" />
			</div>
		</div>
	</Section>

	<Section>
		<div class="max-w-[688px] mx-auto">
			<!-- <div class="text-center"> -->
			<h2 class="text-4xl font-medium font-poppins leading-[90px] mb-4 text-center">What people are saying</h2>
			<div class="lg:max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-10">
				<div class="flex items-center gap-4">
					<img src="https://via.placeholder.com/64" alt="Avatar" class="w-16 h-16 rounded-full" />
					<div>
						<h5 class="font-bold">Developer A</h5>
						<p>This should be the defacto way to develop plugins.</p>
					</div>
				</div>
				<div class="flex items-center gap-4">
					<img src="https://via.placeholder.com/64" alt="Avatar" class="w-16 h-16 rounded-full" />
					<div>
						<h5 class="font-bold">Developer B</h5>
						<p>It saved me hours!</p>
					</div>
				</div>
			</div>
			<!-- </div> -->
		</div>
	</Section>

	<Section>
		<div class="max-w-[688px] mx-auto">
			<div class="text-center">
				<h2 class="text-7xl font-medium font-poppins leading-[90px] mb-4">Go create</h2>
				<!-- <Button class="rounded-full">
				<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M22.8013 11.9309C24.1163 11.0642 24.9895 9.56342 24.9895 7.86179C24.9895 5.17724 22.8118 3 20.1502 3H11.8393C9.16715 3 7 5.1878 7 7.86179C7 9.56342 7.87317 11.0642 9.18819 11.9309C7.87317 12.7976 7 14.2984 7 16C7 17.7016 7.87317 19.2024 9.18819 20.0691C7.87317 20.9358 7 22.4366 7 24.1382C7 26.8228 9.18819 29 11.8708 29C14.585 29 16.7943 26.7911 16.7943 24.0854V19.5935C17.6569 20.3756 18.8036 20.8618 20.0555 20.8618H20.1607C22.8328 20.8618 25 18.674 25 16C24.9895 14.2984 24.1163 12.7976 22.8013 11.9309ZM15.2057 24.0854C15.2057 25.9138 13.7119 27.4146 11.8708 27.4146C10.0614 27.4146 8.58854 25.9455 8.58854 24.1382C8.58854 22.3309 10.0508 20.8724 11.8393 20.8618H15.2057V24.0854ZM15.2057 19.2764H11.8393C10.0403 19.2764 8.58854 17.8073 8.58854 16C8.58854 14.1927 10.0508 12.7236 11.8498 12.7236H15.2162V19.2764H15.2057ZM15.2057 11.1382H11.8393C10.0403 11.1382 8.57802 9.66911 8.57802 7.86179C8.57802 6.05447 10.0403 4.58537 11.8393 4.58537H15.2057V11.1382ZM16.7838 4.58537H20.1502C21.9492 4.58537 23.4115 6.05447 23.4115 7.86179C23.4115 9.66911 21.9492 11.1382 20.1502 11.1382H16.7838V4.58537ZM20.1502 19.2764H20.045C18.2461 19.2764 16.7838 17.8073 16.7838 16C16.7838 14.1927 18.2461 12.7236 20.045 12.7236H20.1502C21.9492 12.7236 23.4115 14.1927 23.4115 16C23.4115 17.8073 21.9492 19.2764 20.1502 19.2764Z"
						fill="white"
					/>
				</svg>
				Try it now
			</Button> -->
			</div>
		</div>
	</Section>
</div>
