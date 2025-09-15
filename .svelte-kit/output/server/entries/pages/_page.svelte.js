import { z as head, w as pop, u as push } from "../../chunks/index2.js";
function _page($$payload, $$props) {
  push();
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>nanoword - Daily Word Puzzle</title>`;
  });
  $$payload.out.push(`<div class="min-h-screen bg-white"><div class="container mx-auto px-4 py-8" style="color: #535353;">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="flex items-center justify-center min-h-screen"><div class="loading loading-spinner loading-lg"></div></div>`);
  }
  $$payload.out.push(`<!--]--></div></div>`);
  pop();
}
export {
  _page as default
};
