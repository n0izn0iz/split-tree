import AABB from "./AABB";
import Vector from "./Vector";

test("constructor throws without arguments", () => {
  expect(() => {
    new AABB();
  }).toThrow();
});

test("constructor matches snapshots with various numbers", () => {
  expect(new AABB(new Vector(42), new Vector(1))).toMatchSnapshot();
  expect(new AABB(new Vector(1, 2), new Vector(1, 1))).toMatchSnapshot();
  expect(
    new AABB(new Vector(78, 45, 12), new Vector(1, 1, 1))
  ).toMatchSnapshot();
});

test("partitions matches snapshots with various numbers", () => {
  expect(new AABB(new Vector(42), { size: 1 }).partitions).toMatchSnapshot();
  expect(new AABB(new Vector(1, 2), { size: 1 }).partitions).toMatchSnapshot();
  expect(
    new AABB(new Vector(78, 45, 12), { size: 1 }).partitions
  ).toMatchSnapshot();
});

test("points matches snapshots with various numbers", () => {
  expect(new AABB(new Vector(42), { size: 1 }).points).toMatchSnapshot();
  expect(new AABB(new Vector(1, 2), { size: 1 }).points).toMatchSnapshot();
  expect(
    new AABB(new Vector(78, 45, 12), { size: 1 }).points
  ).toMatchSnapshot();
});
