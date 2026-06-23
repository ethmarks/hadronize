import demo from "./src/lib/cli/demo.ts";

export default demo;

if ((import.meta as any).main) {
  demo();
}
