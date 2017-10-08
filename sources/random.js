import Vector from "./Vector";

const one = 1;
export const half = number => number / 2;
const coinFlip = (a, b) => (Math.random() >= half(one) ? a : b);

export const genRandomVector = () => {
  const x = Math.random();
  const y = Math.random();
  return new Vector(coinFlip(x, -x), coinFlip(y, -y));
};

export const genRandomPosition = (...extents) =>
  genRandomVector().multiply(new Vector(...extents).scale(0.5));

export const genRandomColor = () => {
  return [Math.random(), Math.random(), Math.random(), 1];
};
