import { describe, it, expect } from "bun:test";
import {
  createEventSignal,
  createCustomEventSignal,
  createEventAccessor,
  createCustomEventAccessor,
} from "../src/solidSignals";
import { EventManager } from "../src/events/events";

type Registry = { count: number; message: string };

describe("solid signal helpers (unit)", () => {
  it("createCustomEventSignal respects default and updates on emit", () => {
    const m = new EventManager<any>();
    const [get, off] = createCustomEventSignal<number>(m, "s", 5);

    expect(get()).toBe(5);
    m.emit("s", 9);
    expect(get()).toBe(9);

    off();
    m.emit("s", 11);
    expect(get()).toBe(9);
  });

  it("createEventSignal (typed) updates when typed event emits", () => {
    const m = new EventManager<Registry>();
    const [get] = createEventSignal<Registry, "message">(m, "message", "init");
    expect(get()).toBe("init");
    m.emit("message", "hi");
    expect(get()).toBe("hi");
  });

  it("createCustomEventAccessor setter emits and getter updates", () => {
    const m = new EventManager<any>();
    const [get, set, off] = createCustomEventAccessor<number>(m, "a", 0);

    const seen: number[] = [];
    m.on("a", (v) => seen.push(v));

    set(7);
    expect(get()).toBe(7);
    expect(seen[seen.length - 1]).toBe(7);

    off();
  });

  it("createEventAccessor integrates with typed manager and cleans up", () => {
    const m = new EventManager<Registry>();
    const [getCount, setCount, off] = createEventAccessor<Registry, "count">(m, "count", 1);

    expect(getCount()).toBe(1);

    const seen: number[] = [];
    m.on("count", (v) => seen.push(v));

    setCount(3);
    expect(getCount()).toBe(3);
    expect(seen[seen.length - 1]).toBe(3);

  off();
  setCount(4);
  expect(getCount()).toBe(4); // local getter still updates because setter sets internal signal
  // external listener still receives emissions (off removed only the internal listener)
  expect(seen[seen.length - 1]).toBe(4);
  });
});
