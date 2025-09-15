import "./index.js";
import "@sveltejs/kit/internal";
import { w as writable } from "./exports.js";
import "./utils.js";
import { n as noop } from "./equality.js";
function create_updated_store() {
  const { set, subscribe } = writable(false);
  {
    return {
      subscribe,
      // eslint-disable-next-line @typescript-eslint/require-await
      check: async () => false
    };
  }
}
const is_legacy = noop.toString().includes("$$") || /function \w+\(\) \{\}/.test(noop.toString());
if (is_legacy) {
  ({
    data: {},
    form: null,
    error: null,
    params: {},
    route: { id: null },
    state: {},
    status: -1,
    url: new URL("https://example.com")
  });
}
const stores = {
  updated: /* @__PURE__ */ create_updated_store()
};
{
  const console_warn = console.warn;
  console.warn = function warn(...args) {
    if (args.length === 1 && /<(Layout|Page|Error)(_[\w$]+)?> was created (with unknown|without expected) prop '(data|form)'/.test(
      args[0]
    )) {
      return;
    }
    console_warn(...args);
  };
}
export {
  stores as s
};
