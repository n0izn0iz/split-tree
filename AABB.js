// @flow
import Vector from "./Vector";
// import Direction from "td-direction";

const minOrMax = mm => (mm ? "min" : "max");

export default class AABB {
  min: Vector;
  max: Vector;
  constructor(
    position: Array<number>,
    options: {
      size?: number,
      clone?: ?AABB,
      min?: ?Array<number>,
      max?: ?Array<number>
    }
  ) {
    const { size = 1, min = null, max = null, clone = null } = options;
    if (clone !== null) {
      this.min = clone.min;
      this.max = clone.max;
    } else if (!(min === null && max === null)) {
      if (min === null || max === null)
        throw new Error(
          `Constructing aABB with ${minOrMax(min)} but no ${minOrMax(max)}`
        );
      this.min = new Vector(...min);
      this.max = new Vector(...max);
    } else if (!position) {
      throw new Error("Constructing aABB without position");
    } else {
      const halfSize = size / 2;
      const positionVector = new Vector(...position);
      this.min = positionVector.minusScalar(halfSize);
      this.max = positionVector.plusScalar(halfSize);
    }
  }

  toString() {
    return `${this
      .dimensionsCount}DAABB: { min: ${this.min.toString()}, max: ${this.max.toString()} }`;
  }

  /*quadrant(directionIndex: number) {
    const position = this.position;

    switch (directionIndex) {
      case Direction.topLeftIndex:
        const left = vec2.fromValues(this.min[0], position[1]);
        const top = vec2.fromValues(position[0], this.max[1]);
        return new AABB({ min: left, max: top });

      case Direction.maxIndex:
        return new AABB({ min: position, max: this.max });

      case Direction.bottomRightIndex:
        const bottom = vec2.fromValues(position[0], this.min[1]);
        const right = vec2.fromValues(this.max[0], position[1]);
        return new AABB({ min: bottom, max: right });

      case Direction.minIndex:
        return new AABB({ min: this.min, max: position });
    }
  }*/

  // $FlowFixMe
  set position(position: Array<number>) {
    const aABB = new AABB(position, { size: this.size });
    this.min = aABB.min;
    this.max = aABB.max;
  }

  // $FlowFixMe
  get position(): Array<number> {
    return this.min.plusScalar(this.halfSize);
  }

  // $FlowFixMe
  get halfSize(): number {
    return this.size / 2;
  }

  // $FlowFixMe
  get size(): number {
    return this.max[0] - this.min[0];
  }

  // $FlowFixMe
  collideAABB(other: AABB) {
    return this.points.some(point => other.containsPoint(point));
  }

  static __points(currentPoint, currentDimension, size) {
    const nextPoint = currentPoint.mapToVector(
      (value, index) => (index === currentDimension - 1 ? value + size : value)
    );
    if (currentDimension === 1)
      return [currentPoint.reverse(), nextPoint.reverse()];
    else
      return [
        ...AABB.__points(currentPoint, currentDimension - 1, size),
        ...AABB.__points(nextPoint, currentDimension - 1, size)
      ];
  }

  // $FlowFixMe
  get points(): Array<Array<number>> {
    return AABB.__points(this.min, this.dimensionsCount, this.size);
  }

  // $FlowFixMe
  get dimensionsCount(): number {
    return this.min.length;
  }

  containsPoint(point: Array<number>) {
    if (point.length !== this.dimensionsCount)
      throw "Dimensions mismatch: Called containsPoint on " +
        this.toString() +
        " with " +
        point.toString();
    return !point.some((value, index) => {
      return value < this.min[index] || value > this.max[index];
    });
  }

  containsAABB(other: AABB) {
    return (
      other.min[0] >= this.min[0] &&
      other.min[1] >= this.min[1] &&
      other.max[0] <= this.max[0] &&
      other.max[1] <= this.max[1]
    );
  }
}
