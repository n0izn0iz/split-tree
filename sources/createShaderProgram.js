// @flow
"use strict";

const stringToShaderType = (gL, string) => {
  if (string === "vertex" || string === "vert") return gL.VERTEX_SHADER;
  else if (string === "fragment" || string === "frag")
    return gL.FRAGMENT_SHADER;
  else throw new UnsupportedShaderType(string, string);
};

type UniformDefinition = { name: string, type: string };
type UniformsDefinitions = Array<UniformDefinition>;
type Uniform = { location: WebGLUniformLocation, type: string };

export class GraphicsProgram {
  constructor(
    gl: WebGLRenderingContext,
    options: {
      shadersIds?: Array<string>,
      shaders: Array<{ string: string, type: string }>,
      uniforms: UniformsDefinitions,
      attributes: Array<string>
    }
  ) {
    const { shadersIds, shaders, uniforms = [], attributes = [] } = options;
    const compiledShaders = [];
    if (shadersIds != null)
      compiledShaders.push(
        ...shadersIds.map(id => fetchAndCompileShader(gl, id))
      );
    if (shaders != null)
      compiledShaders.push(
        ...shaders.map(def => {
          if (!def)
            throw new Error(
              "Bad shader definition while constructing graphics program " +
                this.name +
                ": " +
                def
            );
          return compileShader(
            gl,
            def.string,
            stringToShaderType(gl, def.type)
          );
        })
      );

    const uniformsDefinitions = uniforms;
    const attributesNames = attributes;
    this.gl = gl;
    this.uniforms = {};
    this.attributes = {};

    this.id = gl.createProgram();
    this.attachShaders(compiledShaders);
    this.link();
    this.findUniformsLocations(uniformsDefinitions);
    this.findAttributesLocations(attributesNames);
  }
  get name() {
    return this.constructor.name;
  }
  findAttributesLocations(names: Array<string>) {
    names.forEach(name => this.findAttributeLocation(name));
  }
  findAttributeLocation(name: string) {
    const location = this.gl.getAttribLocation(this.id, name);
    if (location === -1)
      throw new Error(
        `Could not find attribute ${name} in graphics program ${this.name}`
      );
    this.attributes[name] = location;
  }
  setUniform(name: string, ...args: Array<any>) {
    if (!(name in this.uniforms))
      throw new Error(
        "uniform " + name + " not found in graphics program " + this.name
      );
    const { location, type } = this.uniforms[name];
    const functionName = "uniform" + type;
    if (!(functionName in this.gl))
      throw new Error("function gl.uniform" + type + " not found");
    //$FlowFixMe
    this.gl[functionName](location, ...args);
  }
  setUniforms(...newValues: Array<any>) {
    newValues.forEach(value => {
      this.setUniform(...value);
    });
  }
  findUniformsLocations(definitions: UniformsDefinitions) {
    definitions.forEach(definition => this.findUniformLocation(definition));
  }
  findUniformLocation({ name, type }: UniformDefinition) {
    const location = this.gl.getUniformLocation(this.id, name);
    if (location === null)
      throw new Error(
        `Could not find uniform ${name} in  graphics program ${this.name}`
      );
    this.uniforms[name] = { location, type };
  }
  attachShaders(compiledShaders: Array<WebGLShader>) {
    compiledShaders.forEach(shader => {
      this.gl.attachShader(this.id, shader);
    });
  }
  useWith<T>(nestedBlock: (WebGLRenderingContext, GraphicsProgram) => T) {
    this.gl.useProgram(this.id);
    const result = nestedBlock(this.gl, this);
    this.gl.useProgram(null);
    return result;
  }
  link() {
    this.gl.linkProgram(this.id);
    if (!this.gl.getProgramParameter(this.id, this.gl.LINK_STATUS))
      throw new ShaderProgramLinkFailure(this);
  }
  gl: WebGLRenderingContext;
  id: WebGLProgram;
  name: string;
  uniforms: { [string]: Uniform };
  attributes: { [string]: number };
}

const compileShader = (gL, string, type) => {
  const shader = gL.createShader(type);
  gL.shaderSource(shader, string);
  gL.compileShader(shader);
  if (!gL.getShaderParameter(shader, gL.COMPILE_STATUS))
    throw new ShaderCompilationFailure(string, gL.getShaderInfoLog(shader));
  return shader;
};

const fetchAndCompileShader = (gL, id) => {
  let shaderScript = document.getElementById(id);
  if (!(shaderScript && shaderScript instanceof HTMLScriptElement))
    throw new Error("DOM element ${id} is not a script");
  if (!shaderScript) {
    throw new IdNotFound(id);
  }

  let str = "";
  let k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) str += k.textContent;
    k = k.nextSibling;
  }

  if (shaderScript.type == "x-shader/x-fragment") {
    return compileShader(gL, str, gL.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    return compileShader(gL, str, gL.VERTEX_SHADER);
  } else {
    throw new UnsupportedShaderType(id, shaderScript.type);
  }
};

class ShaderCompilationFailure extends Error {
  constructor(shaderId, error) {
    super(
      `Failed to compile shader '${shaderId}'${error
        ? `: ${error.toString()}`
        : ""}`
    );
  }
}

class UnsupportedShaderType extends Error {
  constructor(shaderId, shaderType) {
    super(`The '${shaderId}' shader type '${shaderType}' is not supported`);
  }
}

class IdNotFound extends Error {
  constructor(id) {
    super(`The DOM id '${id}' could not be found`);
  }
}

class ShaderProgramLinkFailure extends Error {
  constructor(shaderProgram) {
    super(`Failed to link shader program '${shaderProgram.name}'`);
  }
}
