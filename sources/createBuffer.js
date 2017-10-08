// @flow
"use strict";

class GraphicsBuffer {
  constructor(
    gl: WebGLRenderingContext,
    data: Array<number>,
    itemSize: number
  ) {
    this.gl = gl;
    this.itemSize = itemSize;
    this.numItems = data.length / itemSize;
    this.id = gl.createBuffer();
    if (!this.id) throw new Error("gl.createBuffer() failed");
    this.useWith(() => {
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    });
  }
  gl: WebGLRenderingContext;
  id: WebGLBuffer;
  itemSize: number;
  numItems: number;
  useWith<T>(nestedBlock: WebGLRenderingContext => T) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.id);
    const result = nestedBlock(this.gl);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    return result;
  }
  enable(attributeLocation: number) {
    this.useWith(() => {
      this.gl.vertexAttribPointer(
        attributeLocation,
        this.itemSize,
        this.gl.FLOAT,
        false,
        0,
        0
      );
      this.gl.enableVertexAttribArray(attributeLocation);
    });
  }
}

export default (
  gl: WebGLRenderingContext,
  data: Array<number>,
  itemSize: number
) => {
  return new GraphicsBuffer(gl, data, itemSize);
};
