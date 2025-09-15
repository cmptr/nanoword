import { z as head, w as pop, u as push } from "../../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/utils.js";
import "../../../../../chunks/state.svelte.js";
function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    {
      $$payload2.out.push("<!--[!-->");
    }
    $$payload2.out.push(`<!--]-->`);
  });
  $$payload.out.push(`<div class="min-h-screen bg-white flex items-center justify-center p-4" style="color: #535353;">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading loading-spinner loading-lg"></div>`);
  }
  $$payload.out.push(`<!--]--></div>`);
  pop();
}
export {
  _page as default
};
