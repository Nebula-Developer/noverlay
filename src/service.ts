import { EventManager } from "./events";

export type Constructor<T = {}> = new (...args: any[]) => T;

export class Core { }

export interface Service {
  onRegister?(core: Core): void;
  onUnregister?(): void;
}

export class Window { }

export class Applet {
  onCreate?(core: Core): void;
  onDestroy?(): void;

  /**
   * Determines whether the application is allowed to close.
   * @return {boolean} True if the application can close, false otherwise.
   */
  canClose(): boolean {
    return true;
  }
}

class TestClass extends Applet {
  override canClose() {
    return false;
  }
}

const testEventManager = new EventManager<{ testEvent: string }>();

testEventManager.on("testEvent", (value, event) => {
  event.stopPropagation();
  console.log(`Event received with value: ${value}`);
});

testEventManager.on("testEvent", (value, event) => {
  event.stopPropagation();
  console.log(`Second event received with value: ${value}`);
}, { priority: 1 });

testEventManager.emit("testEvent", "Hello, World!"); // Console: Event received with value: Hello, World!

function notify<T>(
  initial: T,
  _eventName: string | null = null,
  _eventManagerName: string | null = "events",
) {
  return (target: any, key: string) => {
    const eventName = _eventName ?? key + '-changed';
    let value = initial;
    let managerCached: EventManager<{ [key: string]: T }> | undefined | null; // null means it doesn't exist

    const getManager = (instance: any): EventManager<{ [key: string]: T }> | null => {
      if (managerCached !== undefined) return managerCached;

      const manager: EventManager<{ [key: string]: T }> | undefined =
        instance[_eventManagerName ?? "events"];

      if (manager instanceof EventManager) {
        managerCached = manager;
        return managerCached;
      } else {
        managerCached = null;
        return null;
      }
    }

    Object.defineProperty(target, key, {
      get() {
        return value;
      },
      set(newValue: T) {
        value = newValue;
        getManager(this)?.emit(eventName, newValue);
      },
      configurable: true,
      enumerable: true,
    });
  };
}


/**
 * Generates a dictionary map with '-changed' suffixed keys
 * @template T The original type
 * @template P The keys of T to include in the resulting type
 */
type NotifyEvents<T, P extends keyof T> = {
  [K in keyof Pick<T, P> as `${string & K}-changed`]: T[K];
};


class NotifyingTest {
  @notify(0)
  value!: number;

  events = new EventManager<NotifyEvents<NotifyingTest, "value">>();
}

const testInstance = new NotifyingTest();

testInstance.events.on("value-changed", (value, event) => {
  const x: number = value * 2;
  console.log(`Value changed to: ${value} * 2 = ${x}`);

  event.preventDefault();
});

testInstance.value = 42;
