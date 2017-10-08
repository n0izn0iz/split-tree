import Vector from "./Vector";

test("constructor throws without arguments", () => {
  expect(() => {
    new Vector();
  }).toThrow();
});

test("constructor matches snapshots with various numbers", () => {
  expect(new Vector(42)).toMatchSnapshot();
  expect(new Vector(1, 2)).toMatchSnapshot();
  expect(new Vector(78, 45, 12)).toMatchSnapshot();
});

test("plusScalar adds the scalar to all components", () => {
  expect(new Vector(42, -42, 21, -21).plusScalar(100.42)).toMatchSnapshot();
});
