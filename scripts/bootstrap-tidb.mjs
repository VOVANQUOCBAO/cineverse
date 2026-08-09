import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { bootstrapTiDB } = require("./bootstrap-tidb.js");

export { bootstrapTiDB };
