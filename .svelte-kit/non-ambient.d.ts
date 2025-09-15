
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/puzzle" | "/api/share" | "/api/share/[date]" | "/api/share/[date]/[shareId]" | "/share" | "/share/[date]" | "/share/[date]/[shareId]";
		RouteParams(): {
			"/api/share/[date]": { date: string };
			"/api/share/[date]/[shareId]": { date: string; shareId: string };
			"/share/[date]": { date: string };
			"/share/[date]/[shareId]": { date: string; shareId: string }
		};
		LayoutParams(): {
			"/": { date?: string; shareId?: string };
			"/api": { date?: string; shareId?: string };
			"/api/puzzle": Record<string, never>;
			"/api/share": { date?: string; shareId?: string };
			"/api/share/[date]": { date: string; shareId?: string };
			"/api/share/[date]/[shareId]": { date: string; shareId: string };
			"/share": { date?: string; shareId?: string };
			"/share/[date]": { date: string; shareId?: string };
			"/share/[date]/[shareId]": { date: string; shareId: string }
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/puzzle" | "/api/puzzle/" | "/api/share" | "/api/share/" | `/api/share/${string}` & {} | `/api/share/${string}/` & {} | `/api/share/${string}/${string}` & {} | `/api/share/${string}/${string}/` & {} | "/share" | "/share/" | `/share/${string}` & {} | `/share/${string}/` & {} | `/share/${string}/${string}` & {} | `/share/${string}/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}