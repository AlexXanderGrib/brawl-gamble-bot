import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import { builtinModules } from "module";
import { dirname } from "path";
import ts from "rollup-plugin-typescript2";
import pkg from "./package.json";

const customResolver = resolve({ extensions: [".ts", ".js", ".cjs", ".mjs"] });

/** @type  {import('rollup').RollupOptions} */
const baseConfig = {
  input: "src/index.ts",
  output: [
    {
      dir: dirname(pkg.main),
      format: "cjs",
      exports: "named",
      sourcemap: true,
      strict: true,
      interop: false,
      preserveModules: true
    }
  ],
  external: [
    ...builtinModules.filter(module => !module.startsWith("_")),
    ...Object.keys(pkg.dependencies)
  ],
  plugins: [
    alias({
      entries: [
        { find: "src", replacement: "./src" },
        { find: "@domains", replacement: "./src/domains" },
        { find: "@app", replacement: "./src/application" },
        { find: "@pres", replacement: "./src/presentation" }
      ],
      customResolver
    }),
    json({ preferConst: true, indent: "  ", namedExports: true }),
    customResolver,
    commonjs(),
    ts({ tsconfig: require.resolve("./tsconfig.json") })
  ]
};

export default baseConfig;
