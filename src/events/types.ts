/**
 * Maps a subset of T's keys to their corresponding "-changed" event names.
 *
 * @template T Source type whose keys are being mapped.
 * @template P Keys of {@link T} to include in the resulting event map.
 */
export type ChangeEventNames<T, P extends keyof T> = {
  [K in keyof Pick<T, P> as `${string & K}-changed`]: T[K];
};

/**
 * Represents a single event listener entry, including callback and options.
 *
 * @template Value The type of value the listener receives.
 */
export type ListenerEntry<Value> = {
  /**
   * The function called when the event is emitted.
   */
  callback: EventCallback<Value>;
} & Required<ListenerOptions>;

/**
 * Options for registering an event listener.
 */
export type ListenerOptions = {
  /**
   * Priority of the listener (higher runs first).
   */
  priority?: number;
  /**
   * If true, listener is removed after first call.
   */
  once?: boolean;
};

/**
 * Context object passed to event callbacks, allowing control of propagation and default behavior.
 */
export type EventContext = {
  /**
   * Prevents further listeners from running for this event.
   */
  stopPropagation(): void;
  /**
   * True if propagation has been stopped.
   */
  propagationStopped: boolean;
  /**
   * Prevents the default callback from running after listeners.
   */
  preventDefault: () => void;
  /**
   * True if default has been prevented.
   */
  defaultPrevented: boolean;
};

/**
 * Registry type mapping event names to their payload types.
 */
export type EventRegistry = Record<string, any>;

/**
 * Maps event names to arrays of listener entries for each event.
 *
 * @template T The event registry type.
 */
export type EventListeners<T extends EventRegistry> = {
  /**
   * Array of listeners for each event key.
   */
  [K in keyof T]: Array<ListenerEntry<T[K]>>;
};

/**
 * Function signature for event callbacks.
 *
 * @template T The type of value the event emits.
 * @param value The event payload.
 * @param event The event context object.
 */
export type EventCallback<T> = (value: T, event: EventContext) => void;
