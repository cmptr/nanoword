import adapter from '@sveltejs/adapter-cloudflare-workers';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			config: 'wrangler.toml',
			platformProxy: {
				configPath: 'wrangler.toml',
				environment: undefined,
				experimentalJsonConfig: false,
				persist: false
			}
		})
	}
};

export default config;