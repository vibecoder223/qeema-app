/* Who is on the team. The store keeps this in sync so plain helpers like person()
   can look people up without a hook. Starts empty; the store fills it on creation. */
import type { Person } from "./types";

let list: Person[] = [];
export const people = () => list;
export function setPeople(p: Person[]) { list = p; }
