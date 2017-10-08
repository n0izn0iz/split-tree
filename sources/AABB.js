//@flow
import Vector from "./Vector";
// import Direction from "td-direction";

const minOrMax = mm => (mm ? "min" : "max");

const __points = (currentPoint, currentDimension, extents): Array<Vector> => {
  const nextPoint = currentPoint.mapToVector(
    (value, index) =>
      index === currentDimension - 1 ? value + extents[index] : value
  );
  if (currentDimension === 1) return [currentPoint, nextPoint];
  else
    return [
      ...__points(currentPoint, currentDimension - 1, extents),
      ...__points(nextPoint, currentDimension - 1, extents)
    ];
};

export default class AABB {
  min: Vector;
  max: Vector;
  __pointsCache: ?Array<Vector>;
  __partitionsCache: ?Array<AABB>;
  constructor(position: Vector, extents: Vector) {
    const halfExtents = extents.scale(0.5);
    this.min = position.minus(halfExtents);
    this.max = position.plus(halfExtents);
  }

  toString() {
    return `${this
      .dimensionsCount}DAABB: { min: ${this.min.toString()}, max: ${this.max.toString()} }`;
  }

  set position(position: Vector) {
    const aABB = new AABB(position, this.extents);
    this.min = aABB.min;
    this.max = aABB.max;
    this.__pointsCache = null;
    this.__partitionsCache = null;
  }

  get position(): Vector {
    return this.min.plus(this.halfExtents);
  }

  get halfExtents(): Vector {
    return this.extents.scale(0.5);
  }

  get extents(): Vector {
    return this.max.minus(this.min);
  }

  collideAABB(other: AABB) {
    return other.points.some(point => this.containsPoint(point));
  }

  get partitions(): Array<AABB> {
    if (!this.__partitionsCache) {
      const position = this.position;
      this.__partitionsCache = this.localPoints.map(localPoint => {
        return new AABB(localPoint.scale(0.5).plus(position), this.halfExtents);
      });
    }
    return this.__partitionsCache;
  }

  partition(index: number): AABB {
    /*if (index >= this.partitionsCount)
      throw new Error(
        `Dimensions mismatch: Called partition(${index}) on ${this
          .dimensionsCount}D AABB, maximum index: ${this.partitionsCount - 1}`
      );*/
    const partition = this.partitions[index];
    return new AABB(partition.position, partition.extents);
  }

  get partitionsCount(): number {
    return Math.pow(this.dimensionsCount, 2);
  }

  get points(): Array<Vector> {
    if (!this.__pointsCache)
      this.__pointsCache = __points(
        this.min,
        this.dimensionsCount,
        this.extents
      );
    return this.__pointsCache;
  }

  get localMin(): Vector {
    const { extents } = this;
    return this.extents.mapToVector(value => -(value / 2));
  }

  get localPoints(): Array<Vector> {
    return __points(this.localMin, this.dimensionsCount, this.extents);
  }

  get dimensionsCount(): number {
    return this.min.length;
  }

  containsPoint(point: Vector) {
    if (point.length !== this.dimensionsCount)
      throw "Dimensions mismatch: Called containsPoint on " +
        this.toString() +
        " with " +
        point.toString();
    return point.every(
      (value, index) => this.min[index] <= value && value <= this.max[index]
    );
  }

  containsAABB(other: AABB) {
    if (this.dimensionsCount !== other.dimensionsCount)
      throw "Dimensions mismatch: Called containsAABB on " +
        this.toString() +
        " with " +
        other.toString();
    return this.containsPoint(other.min) && this.containsPoint(other.max);
  }
}
