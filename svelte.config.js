import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-static configuration for GitHub Pages
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: undefined,
			precompress: false,
			strict: true
		})
	}
};

// Create .nojekyll file after build to prevent GitHub Pages from using Jekyll
if (process.env.npm_lifecycle_event === 'build') {
	const buildDir = join(__dirname, 'build');
	setTimeout(() => {
		try {
			writeFileSync(join(buildDir, '.nojekyll'), '');
			console.log('✓ Created .nojekyll file for GitHub Pages');
		} catch (err) {
			// Build directory might not exist yet, that's ok
		}
	}, 100);
}

export default config;
