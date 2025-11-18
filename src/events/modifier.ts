import { deepEqual } from "../utils/utils";
import type { EventManager } from "./events";
import type { EventRegistry } from "./types";

/**
 * Adds a high-priority event listener that can safely modify/re-emit the event.
 *
 * @param manager The EventManager instance
 * @param key Event key to listen for
 * @param callback Function to run when the event fires. Can return a modified value to re-emit.
 * @param priority Optional listener priority (default: 1000)
 * @returns Cleanup function
 */
export function addEventModifier<TR extends EventRegistry, K extends keyof TR>(
	manager: EventManager<TR>,
	key: K,
	callback: (value: TR[K]) => TR[K],
	priority = 1000,
) {
	let internal = false;

	const off = manager.on(
		key,
		(value, event) => {
			if (internal) return;

			internal = true;
			const modified = callback(value);
			if (!deepEqual(modified, value)) {
				event.stopPropagation();
				event.preventDefault();

				manager.emit(key, modified);
			}
			internal = false;
		},
		{ priority },
	);

	return off;
}

/**
 * Adds a high-priority listener for a custom/untyped event that can safely modify or re-emit.
 *
 * @param manager The EventManager instance
 * @param key Event key to listen for
 * @param callback Function to run when the event fires. Can return a modified value to re-emit.
 * @param priority Optional listener priority (default: 1000)
 * @returns Cleanup function
 */
export function addCustomEventModifier<T>(
	manager: EventManager<any>,
	key: string,
	callback: (value: T) => T,
	priority = 1000,
) {
	let internal = false;

	const off = manager.on(
		key,
		(value: T, event) => {
			if (internal) return;

			internal = true;
			const modified = callback(value);
			if (!deepEqual(modified, value)) {
				event.stopPropagation();
				event.preventDefault();

				manager.emit(key, modified);
			}
			internal = false;
		},
		{ priority },
	);

	return off;
}
