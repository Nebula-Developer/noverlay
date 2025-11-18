import { describe, it, expect, beforeEach } from "bun:test";
import { EventManager } from "../src/events/events";
import { addEventModifier, addCustomEventModifier } from "../src/events/modifier";

type Registry = {
	count: number;
	message: string;
};

describe("EventManager - core behaviors", () => {
	let manager: EventManager<Registry>;

	beforeEach(() => {
		manager = new EventManager<Registry>();
	});

	it("calls listeners in priority order (higher first)", () => {
		const seen: string[] = [];

		manager.on("count", () => seen.push("low"), { priority: 0 });
		manager.on("count", () => seen.push("mid"), { priority: 10 });
		manager.on("count", () => seen.push("high"), { priority: 100 });

		manager.emit("count", 1);

		expect(seen).toEqual(["high", "mid", "low"]);
	});

	it("'once' listeners are removed after first trigger", () => {
		let calls = 0;
		manager.on("count", () => calls++, { once: true });
		manager.emit("count", 1);
		manager.emit("count", 2);
		expect(calls).toBe(1);
	});

	it("stopPropagation prevents later listeners from running", () => {
		const seen: string[] = [];
		manager.on("message", (_, e) => { seen.push("first"); e.stopPropagation(); });
		manager.on("message", () => { seen.push("second"); });

		manager.emit("message", "ok");
		expect(seen).toEqual(["first"]);
	});
});

describe("Modifiers, locks, and custom events", () => {
	let manager: EventManager<any>;

	beforeEach(() => {
		manager = new EventManager<any>();
	});

	it("addEventModifier can modify and re-emit a value and prevents default callback", () => {
		const values: number[] = [];
		// listener that collects final emissions
		manager.on("n", (v) => values.push(v));

		// modifier increments numbers and re-emits
		addEventModifier(manager, "n", (v: number) => v + 1);

		let defaultCalled = false;
		manager.emit("n", 1, () => { defaultCalled = true; });

		// modifier should have re-emitted 2, default prevented
		expect(defaultCalled).toBe(false);
		expect(values).toEqual([2]);
	});

	it("modifier internal lock prevents infinite recursion when it re-emits", () => {
		const values: number[] = [];
		manager.on("n", (v) => values.push(v));

		// this modifier will re-emit v+1; without an internal lock this would loop
		const off = addEventModifier(manager, "n", (v: number) => v + 1);

		manager.emit("n", 0);
		// should result in a single re-emitted value (1)
		expect(values).toEqual([1]);

	off();
	});

	it("addCustomEventModifier works with untyped payloads", () => {
		const seen: any[] = [];
		manager.on("custom", (v) => seen.push(v));

		addCustomEventModifier(manager, "custom", (v: any) => ({ wrapped: v }));

		manager.emit("custom", "raw");
	// modifier re-emits the wrapped payload; since the modifier prevents propagation,
	// only the re-emitted (wrapped) value should be observed by listeners
	expect(seen).toEqual([{ wrapped: "raw" }]);
	});
});

describe("EventManager - cleanup and defaults (no frontend)", () => {
	it("on returns an off function that removes the listener", () => {
		const m = new EventManager<any>();
		let calls = 0;
		const cb = () => calls++;
		const off = m.on("x", cb as any);

		m.emit("x", 1);
		expect(calls).toBe(1);

		off();
		m.emit("x", 2);
		expect(calls).toBe(1);
	});

	it("emit returns a context and defaultCallback runs when not prevented", () => {
		const m = new EventManager<any>();
		let defaulted = false;
		const ctx = m.emit("no-listeners", 123, () => { defaulted = true; });
		expect(defaulted).toBe(true);
		expect(ctx.propagationStopped).toBe(false);
		expect(ctx.defaultPrevented).toBe(false);
	});
});


