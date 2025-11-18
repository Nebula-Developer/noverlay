export type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Root application context passed to services and applets.
 */
export class Core {}

export interface Service {
	onRegister?(core: Core): void;
	onUnregister?(): void;
}

/**
 * Represents a top-level UI window or surface.
 */
export class Window {}

export abstract class Applet {
	onCreate?(core: Core): void;
	onDestroy?(): void;

	/**
	 * Determines whether the applet is allowed to close.
	 *
	 * @returns True if the applet can close, false otherwise.
	 */
	canClose(): boolean {
		return true;
	}
}
