import { AbstractDrop } from "../abstract-drop.class";

export class TextDrop extends AbstractDrop<"text"> {
  toString() {
    return this.raw.description;
  }
}
