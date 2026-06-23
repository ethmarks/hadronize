import { demo } from "./src/lib/cli/demo";

if ((import.meta as any).main) {
  demo();
}
