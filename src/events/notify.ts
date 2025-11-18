import { EventManager } from "./events";

/**
 * Decorator factory that turns a property into a value that emits a
 * `<key>-changed` (by default) event on the instance's EventManager when set.
 *
 * Expects the instance to expose an EventManager on `_eventManagerName`
 * (default: "events").
 *
 * @template T Value type held by the property.
 * @template TInstance Instance type that owns the decorated property.
 * @param initial Initial value for the property.
 * @param _eventName Optional custom event name; defaults to `<key>-changed`.
 * @param _eventManagerName Name of the EventManager field on the instance (default: "events").
 * @returns A property decorator that wires change notifications into the EventManager.
 */
export function notify<
	T,
	TInstance extends {
		[managerName: string]: EventManager<Record<string, T>>;
	} = any,
>(
	initial: T,
	_eventName: string | null = null,
	_eventManagerName: string | null = "events",
) {
	return (target: TInstance, key: string) => {
		const eventName = _eventName ?? `${key}-changed`;
		let value = initial;
		// null means it doesn't exist; undefined means not yet resolved.
		let managerCached: EventManager<Record<string, T>> | undefined | null;

		const getManager = (
			instance: TInstance,
		): EventManager<Record<string, T>> | null => {
			if (managerCached !== undefined) return managerCached;

			const manager = instance[_eventManagerName ?? "events"];

			if (manager instanceof EventManager) {
				managerCached = manager;
			} else {
				managerCached = null;
			}

			return managerCached;
		};

		Object.defineProperty(target, key, {
			get() {
				return value;
			},
			set(newValue: T) {
				value = newValue;
				getManager(this as TInstance)?.emit(eventName, newValue);
			},
			configurable: true,
			enumerable: true,
		});
	};
}
