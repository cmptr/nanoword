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
		client: {start:"_app/immutable/entry/start.Cd4L1H21.js",app:"_app/immutable/entry/app.Iu489nbN.js",imports:["_app/immutable/entry/start.Cd4L1H21.js","_app/immutable/chunks/CYyS2HqM.js","_app/immutable/chunks/B9ZZyxSW.js","_app/immutable/chunks/BOW-wTfZ.js","_app/immutable/chunks/Awjsra86.js","_app/immutable/entry/app.Iu489nbN.js","_app/immutable/chunks/BOW-wTfZ.js","_app/immutable/chunks/B9ZZyxSW.js","_app/immutable/chunks/CWj6FrbW.js","_app/immutable/chunks/DjkdqWsY.js","_app/immutable/chunks/Dz78xBzY.js","_app/immutable/chunks/Awjsra86.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
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
				endpoint: __memo(() => import('./entries/endpoints/api/puzzle/_server.js'))
			},
			{
				id: "/api/share",
				pattern: /^\/api\/share\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/share/_server.js'))
			},
			{
				id: "/api/share/[date]/[shareId]",
				pattern: /^\/api\/share\/([^/]+?)\/([^/]+?)\/?$/,
				params: [{"name":"date","optional":false,"rest":false,"chained":false},{"name":"shareId","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/share/_date_/_shareId_/_server.js'))
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
