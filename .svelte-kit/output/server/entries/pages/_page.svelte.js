import { J as push, W as head, O as push_element, T as pop_element, N as pop, F as FILENAME } from "../../chunks/index.js";
_page[FILENAME] = "src/routes/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>nanoword - Daily Word Puzzle</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen bg-white">`);
  push_element($$payload, "div", 30, 0);
  $$payload.out.push(`<div class="container mx-auto px-4 py-8" style="color: #535353;">`);
  push_element($$payload, "div", 31, 1);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center justify-center min-h-screen">`);
    push_element($$payload, "div", 33, 3);
    $$payload.out.push(`<div class="loading loading-spinner loading-lg">`);
    push_element($$payload, "div", 34, 4);
    $$payload.out.push(`</div>`);
    pop_element();
    $$payload.out.push(`</div>`);
    pop_element();
  }
  $$payload.out.push(`<!--]--></div>`);
  pop_element();
  $$payload.out.push(`</div>`);
  pop_element();
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _page as default
};
