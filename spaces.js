import Space from "./Space";

export default {
  "1Dimension": new Space(["width"]),
  "1P1Dimensions": new Space(["width", "duration"]),
  "2Dimensions": new Space(["width", "height"]),
  "2P1Dimensions": new Space(["width", "height", "duration"]),
  "3Dimensions": new Space(["width", "height", "depth"]),
  "3P1Dimensions": new Space(["width", "height", "depth", "duration"])
};
