import type { Component } from "solid-js";
import { EventManager } from "./events/events";
import { createEventAccessor, createEventSignal } from "./solidSignals";
import { addEventModifier } from "./events/modifier";

const App: Component = () => {
  type AppEvents = {
    "position-changed": { x: number; y: number };
  };
  const eventManager = new EventManager<AppEvents>();


  let v = 1;
  const [position, setPosition] = createEventAccessor(
    eventManager,
    "position-changed",
	{ x: v, y: v }
  );
  
  addEventModifier(eventManager, "position-changed", (_) => {
	if (v > 9) v = 1;
	console.log(`Modifier: Changing position to X: ${v}, Y: ${v}`);
	return { x: v, y: v };
  });
  
  return (
    <div class="w-full min-h-screen h-0 bg-slate-800 text-white flex items-center justify-center text-center font-mono">
      <div class="flex flex-col gap-5">
        <h1 class="text-3xl font-bold">Event Testing</h1>
        <button
          class="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          onclick={() => {
			v++;
            setPosition({ x: v, y: v });
          }}
          type="button"
        >
          Change Position
        </button>
        <p class="text-lg">
          Current Position: X: {position().x}, Y: {position().y}
        </p>

		<div class="fixed w-2 h-2 rounded-full bg-red-500 pointer-events-none" style={{
			top: `${position()!.y * 10}%`,
			left: `${position()!.x * 10}%`,
			transform: 'translate(-50%, -50%)',
		}}></div>
      </div>
    </div>
  );
};

export default App;
