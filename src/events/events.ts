import { EventRegistry, EventListeners, EventContext, ListenerOptions, ListenerEntry, EventCallback } from "./types";



export class EventManager<T extends EventRegistry> {
  private listeners: Partial<EventListeners<T>> = {};

  on<K extends keyof T>(
    key: K,
    callback: (value: T[K], event: EventContext) => void,
    options?: ListenerOptions
  ): () => void;
  on(key: string, callback: (value: any, event: EventContext) => void, options?: ListenerOptions): () => void;

  on(key: string, callback: (value: any, event: EventContext) => void, options?: ListenerOptions) {
    if (!this.listeners[key]) (this.listeners[key] as any) = [];

    const entry: ListenerEntry<any> = {
      callback,
      priority: options?.priority ?? 0,
      once: options?.once ?? false,
    };

    const list = this.listeners[key]!;
    let insertIndex = list.findIndex(e => e.priority < entry.priority);
    if (insertIndex === -1) insertIndex = list.length;
    list.splice(insertIndex, 0, entry);

    return () => this.off(key as keyof T, callback);
  }

  off<K extends keyof T>(key: K, callback: EventCallback<T[K]>): void;
  off(key: string, callback: (value: any, event: EventContext) => void): void;

  off(key: string, callback: (value: any, event: EventContext) => void) {
    const list = this.listeners[key];
    if (!list) return;
    (this.listeners[key] as any) = list.filter((entry) => entry.callback !== callback);
  }

  emit<K extends keyof T>(key: K, value: T[K], defaultCallback?: EventCallback<T[K]>): EventContext;
  emit(key: string, value: any, defaultCallback?: EventCallback<any>): EventContext;

  emit(key: string, value: any, defaultCallback?: EventCallback<any>): EventContext {
    const current = this.listeners[key];
    if (!current || current.length === 0) {
      const emptyCtx: EventContext = {
        propagationStopped: false,
        defaultPrevented: false,
        stopPropagation() { },
        preventDefault() { }
      };
      if (!emptyCtx.defaultPrevented)
        defaultCallback?.(value, emptyCtx);
      return emptyCtx;
    }

  // make a shallow copy so mutations (off/on) during dispatch don't affect our iteration
  const list = (this.listeners[key] as Array<any>).slice();

    const ctx: EventContext = {
      propagationStopped: false,
      defaultPrevented: false,

      stopPropagation() { ctx.propagationStopped = true; },
      preventDefault() { ctx.defaultPrevented = true; }
    };

    for (let i = 0; i < list.length; i++) {
      const entry = list[i];
  entry.callback(value, ctx);

      if (entry.once) this.off(key, entry.callback);

      if (ctx.propagationStopped) break;
    }

    if (!ctx.defaultPrevented)
      defaultCallback?.(value, ctx);

    return ctx;
  }
}
