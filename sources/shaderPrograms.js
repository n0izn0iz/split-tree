import { GraphicsProgram } from "../sources/createShaderProgram";
import shaders from "../shaders";

export class TreeGrid extends GraphicsProgram {
  constructor(gl) {
    super(gl, {
      shaders: [shaders.vertex.quadcoord, shaders.fragment.borders],
      attributes: ["modelVertex", "quadCoordIn"],
      uniforms: [
        { name: "position", type: "2fv" },
        { name: "spaceSize", type: "1f" },
        { name: "modelSize", type: "1f" }
      ]
    });
  }
}

export class Default extends GraphicsProgram {
  constructor(gl) {
    super(gl, {
      shaders: [shaders.vertex.basic, shaders.fragment.rgba],
      attributes: ["modelVertex"],
      uniforms: [
        { name: "position", type: "2fv" },
        { name: "spaceSize", type: "1f" },
        { name: "modelSize", type: "1f" },
        { name: "color", type: "4fv" }
      ]
    });
  }
}

export class RGBAQuadBorders extends GraphicsProgram {
  constructor(gl) {
    super(gl, {
      shaders: [
        shaders.vertex.elasticQuadcoord,
        shaders.fragment.elasticColorQuadBorders
      ],
      attributes: ["modelVertex", "quadCoordIn"],
      uniforms: [
        { name: "position", type: "2fv" },
        { name: "spaceSize", type: "1f" },
        { name: "modelSize", type: "2fv" },
        { name: "color", type: "4fv" }
      ]
    });
  }
}

export class RGBA extends GraphicsProgram {
  constructor(gl) {
    super(gl, {
      shaders: [shaders.vertex.elastic, shaders.fragment.rgba],
      attributes: ["modelVertex"],
      uniforms: [
        { name: "position", type: "2fv" },
        { name: "spaceSize", type: "1f" },
        { name: "modelSize", type: "2fv" },
        { name: "color", type: "4fv" }
      ]
    });
  }
}

export default [
  Default,
  TreeGrid,
  RGBA,
  RGBAQuadBorders
].reduce((result, program) => {
  console.log("Adding graphics program", program);
  result[program.name] = program;
  return result;
}, {});
