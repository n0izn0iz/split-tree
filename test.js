import Vector from "./Vector";
import Space from "./Space";
import spaces from "./spaces";
import AABB from "./AABB";
import SplitTree from "./SplitTree";

const space = spaces["3Dimensions"];
console.log(space.toString());

const position = space.originVector;
console.log(position.toString());

const aABB = new AABB(position);
console.log(aABB.toString());

const splitTree = new SplitTree(space);
console.log(splitTree.toString());

console.log(splitTree.aABB.containsPoint(position.plusScalar(0.6)));
