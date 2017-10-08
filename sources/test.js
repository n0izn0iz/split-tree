import Vector from "./Vector";
import Space from "./Space";
import spaces from "./spaces";
import AABB from "./AABB";
import SplitTree from "./SplitTree";

const space = spaces["3Dimensions"];
space.toString();

const position = space.originVector;
position.toString();

const aABB = new AABB(position, { size: 1 });
aABB.toString();

const splitTree = new SplitTree(space);
splitTree.toString();

splitTree.aABB.containsPoint(position.plusScalar(0.6));

test("doesn't crash", () => {});
