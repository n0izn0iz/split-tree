import Vector from "./Vector";

export default class Space extends Array {
  constructor(dimensions) {
    super(...dimensions);
    this.__proto__ = Space.prototype;
  }
  toString() {
    return `${this.length}DSpace: [ ${this.join(", ")} ]`;
  }
  get originVector() {
    return new Vector(...this.map(() => 0));
  }
}
