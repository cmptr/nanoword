import { J as push, O as push_element, Q as slot, T as pop_element, N as pop, F as FILENAME } from "../../chunks/index.js";
_layout[FILENAME] = "src/routes/+layout.svelte";
function _layout($$payload, $$props) {
  push(_layout);
  $$payload.out.push(`<main class="svelte-12qhfyh">`);
  push_element($$payload, "main", 5, 0);
  $$payload.out.push(`<!---->`);
  slot($$payload, $$props, "default", {});
  $$payload.out.push(`<!----></main>`);
  pop_element();
  pop();
}
_layout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _layout as default
};
