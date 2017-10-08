import { RGBA, RGBAQuadBorders } from "./shaderPrograms";
import Vector from "./Vector";

class RectanglesRenderer {
  constructor(gl, squareVertexPositionBuffer, squareQuadCoordBuffer) {
    this.gl = gl;
    this.squareVertexPositionBuffer = squareVertexPositionBuffer;
    this.squareQuadCoordBuffer = squareQuadCoordBuffer;
    this.programs = {
      default: new RGBA(gl),
      borders: new RGBAQuadBorders(gl)
    };
  }
  draw(position, extents, color, space, borderOnly) {
    const { gl, programs } = this;
    (borderOnly
      ? programs.borders
      : programs.default
    ).useWith((gl, program) => {
      this.squareVertexPositionBuffer.enable(program.attributes.modelVertex);
      if (borderOnly)
        this.squareQuadCoordBuffer.enable(program.attributes.quadCoordIn);
      gl.enable(gl.BLEND);
      gl.disable(gl.DEPTH_TEST);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      program.setUniforms(
        ["spaceSize", space.size],
        ["modelSize", [...extents]],
        ["color", color],
        ["position", [...position]]
      );
      gl.drawArrays(
        gl.TRIANGLE_STRIP,
        0,
        this.squareVertexPositionBuffer.numItems
      );
    });
  }
  drawSquare(position, size, color, space, borderOnly) {
    this.draw(position, new Vector(size, size), color, space, borderOnly);
  }
}

export default RectanglesRenderer;
