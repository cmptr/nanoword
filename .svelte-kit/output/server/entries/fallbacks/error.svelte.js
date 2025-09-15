import { V as getContext, J as push, O as push_element, T as pop_element, N as pop, F as FILENAME } from "../../chunks/index.js";
import { s as stores } from "../../chunks/client.js";
const CONTENT_REGEX = /[&<]/g;
function escape_html(value, is_attr) {
  const str = String(value ?? "");
  const pattern = CONTENT_REGEX;
  pattern.lastIndex = 0;
  let escaped = "";
  let last = 0;
  while (pattern.test(str)) {
    const i = pattern.lastIndex - 1;
    const ch = str[i];
    escaped += str.substring(last, i) + (ch === "&" ? "&amp;" : ch === '"' ? "&quot;" : "&lt;");
    last = i + 1;
  }
  return escaped + str.substring(last);
}
({
  check: stores.updated.check
});
function context() {
  return getContext("__request__");
}
function context_dev(name) {
  try {
    return context();
  } catch {
    throw new Error(
      `Can only read '${name}' on the server during rendering (not in e.g. \`load\` functions), as it is bound to the current request via component context. This prevents state from leaking between users.For more information, see https://svelte.dev/docs/kit/state-management#avoid-shared-state-on-the-server`
    );
  }
}
const page$1 = {
  get error() {
    return context_dev("page.error").page.error;
  },
  get status() {
    return context_dev("page.status").page.status;
  }
};
const page = page$1;
Error$1[FILENAME] = "node_modules/@sveltejs/kit/src/runtime/components/svelte-5/error.svelte";
function Error$1($$payload, $$props) {
  push(Error$1);
  $$payload.out.push(`<h1>`);
  push_element($$payload, "h1", 5, 0);
  $$payload.out.push(`${escape_html(page.status)}</h1>`);
  pop_element();
  $$payload.out.push(` <p>`);
  push_element($$payload, "p", 6, 0);
  $$payload.out.push(`${escape_html(page.error?.message)}</p>`);
  pop_element();
  pop();
}
Error$1.render = function() {
  throw new Error$1("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  Error$1 as default
};
