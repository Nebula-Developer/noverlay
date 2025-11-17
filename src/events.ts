type ListenerOptions = {
  priority?: number;
  once?: boolean;
};

type EventContext = {
  stopPropagation(): void;
  propagationStopped: boolean;
  preventDefault: () => void;
  defaultPrevented: boolean;
};

type EventRegistry = Record<string, any>;

type EventListeners<T extends EventRegistry> = {
  [K in keyof T]: Array<ListenerEntry<T[K]>>;
};

type EventCallback<T> = (value: T, event: EventContext) => void;

type ListenerEntry<Value> = {
  callback: EventCallback<Value>;
  priority: number;
  once: boolean;
};

export class EventManager<T extends EventRegistry> {
  private listeners: Partial<EventListeners<T>> = {};

  on<K extends keyof T>(
    key: K,
    callback: (value: T[K], event: EventContext) => void
  ): () => void;
  on(key: string, callback: (value: any, event: EventContext) => void): () => void;

  on(key: string, callback: (value: any, event: EventContext) => void) {
    if (!this.listeners[key]) (this.listeners[key] as any) = [];

    const entry: ListenerEntry<any> = {
      callback,
      priority: 0,
      once: false,
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
    const list = this.listeners[key];
    if (!list || list.length === 0) {
      const emptyCtx: EventContext = {
        propagationStopped: false,
        defaultPrevented: false,
        stopPropagation() { },
        preventDefault() { }
      };
      return emptyCtx;
    }

    const ctx: EventContext = {
      propagationStopped: false,
      defaultPrevented: false,

      stopPropagation() { ctx.propagationStopped = true; },
      preventDefault() { ctx.defaultPrevented = true; }
    };

    for (let i = 0; i < list.length;) {
      const entry = list[i];
      entry.callback(value, ctx);

      if (entry.once) this.off(key, entry.callback);
      else i++;

      if (ctx.propagationStopped) break;
    }

    if (!ctx.defaultPrevented)
      defaultCallback?.(value, ctx);

    return ctx;
  }
}
