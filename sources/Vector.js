// @flow
export default class Vector extends Array<number> {
  constructor(...values: Array<number>) {
    if (values.length === 1) {
      super();
      this[0] = values[0];
    } else {
      super(...values);
    }
    // $FlowFixMe
    this.__proto__ = Vector.prototype;
    //if (this.length === 0) throw new Error("Created 0 dimensions Vector");
  }
  toString() {
    return `${this.length}DVector: { ${[...this]
      .map((value, index) => `${["x", "y", "z", "t"][index]}: ${value}`)
      .join(", ")} }`;
  }

  get array(): Array<number> {
    return [...this];
  }

  get time(): number {
    return this[this.length - 1];
  }

  get x(): number {
    return this[0];
  }
  get y(): number {
    return this[1];
  }
  set y(newValue: number) {
    this[1] = newValue;
  }
  mapToVector(...args: Array<any>): Vector {
    return new Vector(...this.map(...args));
  }
  multiply(other: Vector) {
    return this.mapToVector((value, index) => value * other[index]);
  }
  plusScalar(scalar: number) {
    return this.mapToVector(value => value + scalar);
  }
  minusScalar(scalar: number) {
    return this.mapToVector(value => value - scalar);
  }
  reverseVector() {
    return new Vector(...super.reverse());
  }
  plus(other: Vector) {
    if (Array.isArray(other)) other = new Vector(...other);
    const biggestVector = this.length > other.length ? this : other;
    const smallestVector = biggestVector === other ? this : other;
    return biggestVector.mapToVector(
      (value, index) =>
        value + (index < smallestVector.length ? smallestVector[index] : 0)
    );
  }
  minus(other: Vector) {
    return this.plus(other.scale(-1));
  }
  scale(scalar: number) {
    return this.mapToVector(value => value * scalar);
  }
  normalize() {
    const length = Math.sqrt(
      this.reduce((lengthSquared, value) => {
        return lengthSquared + value * value;
      }, 0)
    );
    return this.mapToVector(value => value / length);
  }
  inequal(other: Vector) {
    return this.some((value, index) => value !== other[index]);
  }
  equal(other: Vector) {
    return !this.inequal(other);
  }
  lesser(other: Vector) {
    return !this.some((value, index) => value >= other[index]);
  }
  lesserOrEqual(other: Vector) {
    if (this.equal(other)) return true;
    return this.lesser(other);
  }
  greater(other: Vector) {
    return !this.lesserOrEqual(other);
  }

  greaterOrEqual(other: Vector) {
    if (this.equal(other)) return true;
    return this.greater(other);
  }
}
