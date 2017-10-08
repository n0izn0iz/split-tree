// @flow
import Vector from "./Vector";
import AABB from "./AABB";

type EntityManager = {
  moveEntity: (Entity, Vector) => mixed
};

export default class Entity {
  position: Vector;
  extents: Vector;
  parent: ?EntityManager;
  color: Array<number>;
  ghosted: boolean;
  constructor(options: {
    position: Vector,
    extents: Vector,
    color: Array<number>
  }) {
    const { position, extents, color } = options;
    this.position = position;
    this.extents = extents;
    this.color = color;
    this.ghosted = false;
  }

  move(newPosition: Vector) {
    if (this.parent) {
      return this.parent.moveEntity(this, newPosition);
    } else {
      this.position = newPosition;
      return false;
    }
  }

  get aABB(): AABB {
    return new AABB(this.position, this.extents);
  }

  toString() {
    return `Entity { position: ${this.position.toString()}, extents: ${this.extents.toString()} }`;
  }
}
