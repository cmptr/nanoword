import { J as push, W as head, O as push_element, T as pop_element, N as pop, F as FILENAME } from "../../../../../chunks/index.js";
import "../../../../../chunks/client.js";
_page[FILENAME] = "src/routes/share/[date]/[shareId]/+page.svelte";
function _page($$payload, $$props) {
  push(_page);
  head($$payload, ($$payload2) => {
    {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]-->`);
  });
  $$payload.out.push(`<div class="min-h-screen bg-white flex items-center justify-center p-4" style="color: #535353;">`);
  push_element($$payload, "div", 56, 0);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading loading-spinner loading-lg">`);
    push_element($$payload, "div", 58, 2);
    $$payload.out.push(`</div>`);
    pop_element();
  }
  $$payload.out.push(`<!--]--></div>`);
  pop_element();
  pop();
}
_page.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _page as default
};
