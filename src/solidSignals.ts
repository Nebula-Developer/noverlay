import { createSignal, onCleanup } from "solid-js";
import type { EventManager } from "./events/events";
import { EventRegistry } from "./events/types";

// Helper types to make overloads readable
type Getter<T> = () => T | undefined;
type Setter<T> = (v: T) => void;
type Off = () => void;

type SignalNoDefault<T> = [Getter<T>, Off];
type SignalWithDefault<T> = [() => T, Off];
type AccessorNoDefault<T> = [Getter<T>, Setter<T>, Off];
type AccessorWithDefault<T> = [() => T, Setter<T>, Off];

/**
 * Internal helper to create a signal bound to an event.
 * Supports these call shapes:
 *  - (manager, key) -> Signal without default
 *  - (manager, key, defaultValue) -> Signal with default
 *  - (manager, key, undefined, true) -> Accessor without default
 *  - (manager, key, defaultValue, true) -> Accessor with default
 * The final optional `priority` number controls listener priority.
 */
function _createSignalFromEvent<T>(
  manager: EventManager<any>,
  key: string,
  defaultValue?: T,
  emitOnSet = false,
  priority?: number
) : SignalNoDefault<T> | SignalWithDefault<T> | AccessorNoDefault<T> | AccessorWithDefault<T> {
  const hasDefault = arguments.length >= 3 && defaultValue !== undefined;
  const [value, setValue] = createSignal<T | undefined>(hasDefault ? defaultValue : undefined);

  let internal = false;

  const off = manager.on(key, (v: T) => {
    if (internal) return;
    setValue(() => v);
  }, typeof priority === 'number' ? { priority } : undefined);

  let setter: Setter<T> | undefined;
  if (emitOnSet) {
    setter = (v: T) => {
      // mark internal only during local set so re-emitted events can update
      internal = true;
      setValue(() => v);
      internal = false;
      manager.emit(key, v);
    };
  }

  onCleanup(off);

  if (setter) {
    return hasDefault ? ([() => value()!, setter, off] as const) : ([value, setter, off] as const);
  }

  return hasDefault ? ([() => value()!, off] as const) : ([value, off] as const);
}

/**
 * Creates a SolidJS signal bound to a typed event from the EventRegistry.
 *
 * @param manager The EventManager instance to subscribe to.
 * @param key The event key to listen for (must exist in the EventRegistry).
 * @param defaultValue Optional initial value for the signal before any event fires.
 *
 * @returns A tuple containing:
 *  - a signal holding the latest event payload (`() => TR[K] | undefined`)
 *  - a cleanup function to remove the listener
 */
export function createEventSignal<TR extends EventRegistry, K extends keyof TR>(manager: EventManager<TR>, key: K): readonly [() => TR[K] | undefined, () => void];
export function createEventSignal<TR extends EventRegistry, K extends keyof TR>(manager: EventManager<TR>, key: K, defaultValue: TR[K]): readonly [() => TR[K], () => void];
export function createEventSignal<TR extends EventRegistry, K extends keyof TR>(manager: EventManager<TR>, key: K, defaultValue?: TR[K]) {
  return _createSignalFromEvent<TR[K]>(manager, key as string, defaultValue, false) as any;
}

/**
 * Creates a SolidJS signal bound to a custom event whose payload type is provided manually.
 *
 * @param manager The EventManager instance to subscribe to.
 * @param key The event key to listen for (not required to exist in the EventRegistry).
 * @param defaultValue Optional initial value for the signal before any event fires.
 *
 * @returns A tuple containing:
 *  - a signal holding the latest event payload (`() => T | undefined`)
 *  - a cleanup function to remove the listener
 */
export function createCustomEventSignal<T>(manager: EventManager<any>, key: string): readonly [() => T | undefined, () => void];
export function createCustomEventSignal<T>(manager: EventManager<any>, key: string, defaultValue: T): readonly [() => T, () => void];
export function createCustomEventSignal<T>(manager: EventManager<any>, key: string, defaultValue?: T) {
  return _createSignalFromEvent(manager, key, defaultValue, false) as any;
}


/**
 * Creates an accessor bound to a typed event from the EventRegistry.
 *
 * Getting the accessor returns the latest event value.
 * Setting the accessor updates the value **and emits the event** with that value.
 *
 * @param manager The EventManager instance to subscribe to and emit from.
 * @param key The event key to listen for (must exist in the EventRegistry).
 * @param defaultValue Optional initial value for the accessor before any event fires.
 *
 * @returns A tuple containing:
 *  - a getter for the current value (`() => TR[K] | undefined`)
 *  - a setter that updates the value and emits the event (`(v: TR[K]) => void`)
 *  - a cleanup function that stops listening to the event
 */
export function createEventAccessor<TR extends EventRegistry, K extends keyof TR>(manager: EventManager<TR>, key: K): readonly [() => TR[K] | undefined, (v: TR[K]) => void, () => void];
export function createEventAccessor<TR extends EventRegistry, K extends keyof TR>(manager: EventManager<TR>, key: K, defaultValue: TR[K]): readonly [() => TR[K], (v: TR[K]) => void, () => void];
export function createEventAccessor<TR extends EventRegistry, K extends keyof TR>(manager: EventManager<TR>, key: K, defaultValue?: TR[K]) {
  return _createSignalFromEvent<TR[K]>(manager, key as string, defaultValue, true) as any;
}

/**
 * Creates an accessor bound to a custom event whose payload type is provided manually.
 *
 * Getting the accessor returns the latest event value.
 * Setting the accessor updates the value **and emits the event** with that value.
 *
 * @param manager The EventManager instance to subscribe to and emit from.
 * @param key The event key to listen for (not required to exist in the EventRegistry).
 * @param defaultValue Optional initial value for the accessor before any event fires.
 *
 * @returns A tuple containing:
 *  - a getter for the current value (`() => T | undefined`)
 *  - a setter that updates the value and emits the event (`(v: T) => void`)
 *  - a cleanup function that stops listening to the event
 */
export function createCustomEventAccessor<T>(manager: EventManager<any>, key: string): readonly [() => T | undefined, (v: T) => void, () => void];
export function createCustomEventAccessor<T>(manager: EventManager<any>, key: string, defaultValue: T): readonly [() => T, (v: T) => void, () => void];
export function createCustomEventAccessor<T>(manager: EventManager<any>, key: string, defaultValue?: T) {
  return _createSignalFromEvent<T>(manager, key, defaultValue, true) as any;
}
