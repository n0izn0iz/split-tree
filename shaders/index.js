// Vertex shaders
import basic from "./basic.vert";
import quadcoord from "./quadcoord.vert";
import elastic from "./elastic.vert";
import elasticQuadcoord from "./elasticQuadcoord.vert";

// Fragment shaders
import borders from "./borders.frag";
import rgba from "./rgba.frag";
import white from "./white.frag";
import elasticColorQuadBorders from "./elasticColorQuadBorders.frag";

// Don't forget to add them here too
const vertexShaders = { basic, quadcoord, elastic, elasticQuadcoord };
const fragmentShaders = { white, rgba, borders, elasticColorQuadBorders };

const mapShaders = (list, type) =>
  Object.keys(list).reduce((result, name) => {
    result[name] = {
      string: list[name],
      type
    };
    return result;
  }, {});

export default {
  vertex: mapShaders(vertexShaders, "vertex"),
  fragment: mapShaders(fragmentShaders, "fragment")
};
