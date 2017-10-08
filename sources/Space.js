// @flow
import Vector from "./Vector";
import AABB from "./AABB";

export default class Space extends Array<string> {
  size: number;
  constructor(dimensions: Array<string>) {
    super(...dimensions);
    // $FlowFixMe
    this.__proto__ = Space.prototype;
    this.size = 1;
  }
  toString() {
    return `${this.length}DSpace: [ ${this.join(", ")} ]`;
  }
  get originVector(): Vector {
    return new Vector(...this.map(() => 0));
  }
  get extents(): Vector {
    return this.originVector.mapToVector(() => this.size);
  }
  get aABB(): AABB {
    return new AABB(this.originVector, this.extents);
  }
}
