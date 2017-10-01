import Vector from "./Vector";
import AABB from "./AABB";

export default class Entity {
  constructor({ position, size, parent = null }) {
    this.position = new Vector(...position);
    this.size = size;
  }

  move(newPosition) {
    if (this.parent) {
      return this.parent.moveEntity(this, newPosition);
    } else {
      this.position = vector;
      return false;
    }
  }

  get aABB() {
    return new AABB(this.position, { size: this.size });
  }

  toString() {
    return `Entity { position: ${this.position}, size: ${this.size} }`;
  }
}
