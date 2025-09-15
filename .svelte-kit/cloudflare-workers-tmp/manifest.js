export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.JAsPCYVM.js",app:"_app/immutable/entry/app.BGqOP1x0.js",imports:["_app/immutable/entry/start.JAsPCYVM.js","_app/immutable/chunks/qJMkmo8-.js","_app/immutable/chunks/CmzJJKhx.js","_app/immutable/chunks/g-oURhXx.js","_app/immutable/entry/app.BGqOP1x0.js","_app/immutable/chunks/CmzJJKhx.js","_app/immutable/chunks/3KWLfpDR.js","_app/immutable/chunks/BL2QTzks.js","_app/immutable/chunks/D300RiNs.js","_app/immutable/chunks/g-oURhXx.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js')),
			__memo(() => import('../output/server/nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/puzzle",
				pattern: /^\/api\/puzzle\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/puzzle/_server.js'))
			},
			{
				id: "/api/share",
				pattern: /^\/api\/share\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/share/_server.js'))
			},
			{
				id: "/api/share/[date]/[shareId]",
				pattern: /^\/api\/share\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"date","optional":false,"rest":false,"chained":false},{"name":"shareId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('../output/server/entries/endpoints/api/share/_date_/_shareId_/_server.js'))
			},
			{
				id: "/share/[date]/[shareId]",
				pattern: /^\/share\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"date","optional":false,"rest":false,"chained":false},{"name":"shareId","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

export const prerendered = new Map([]);

export const base_path = "";
