import Space from "./Space";

export default class Vector extends Array {
  constructor(...values) {
    const space = values[0];
    if (space instanceof Space) super(...space.originVector);
    else {
      if (values.length === 1) {
        super(1);
        this[0] = values[0];
      } else super(...values);
    }
    this.__proto__ = Vector.prototype;
    if (this.length === 0) throw new Error("Created 0 dimensions Vector");
  }
  toString() {
    return `${this.length}DVector: { ${[...this]
      .map((value, index) => `${["x", "y", "z", "t"][index]}: ${value}`)
      .join(", ")} }`;
  }
  mapToVector(...args) {
    return new Vector(...this.map(...args));
  }
  plusScalar(scalar) {
    return this.mapToVector(value => value + scalar);
  }
  minusScalar(scalar) {
    return this.mapToVector(value => value - scalar);
  }
  plus(other) {
    if (Array.isArray(other)) other = new Vector(...other);
    const biggestVector = this.length > other.length ? this : other;
    const smallestVector = biggestVector === other ? this : other;
    return biggestVector.mapToVector(
      (value, index) =>
        value + (index < smallestVector.length ? smallestVector[index] : 0)
    );
  }
  scale(scalar) {
    return this.mapToVector(value => value * scalar);
  }
}
