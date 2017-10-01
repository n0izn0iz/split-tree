"use strict";

// Create a new GPU program from string options
export default (
  gl,
  { name, shadersIds, uniformsNames = [], attributesNames = [] }
) => {
  const compiledShaders = shadersIds.map(id => {
    return fetchAndCompileShader(gl, id);
  });

  const program = gl.createProgram();
  program.name = name;
  compiledShaders.forEach(shader => {
    gl.attachShader(program, shader);
  });
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw new ShaderProgramLinkFailure(program);

  gl.useProgram(program);
  program.uniforms = uniformsNames.reduce((uniforms, name) => {
    uniforms[name] = gl.getUniformLocation(program, name);
    return uniforms;
  }, {});
  program.attributes = attributesNames.reduce((attributes, name) => {
    attributes[name] = gl.getAttribLocation(program, name);
    return attributes;
  }, {});

  return program;
};

const fetchAndCompileShader = (gl, id) => {
  let shaderScript = document.getElementById(id);
  if (!shaderScript) {
    throw new IdNotFound(id);
  }

  let str = "";
  let k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) str += k.textContent;
    k = k.nextSibling;
  }

  let shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    throw new UnsupportedShaderType(id, shaderScript.type);
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new ShaderCompilationFailure(id, gl.getShaderInfoLog(shader));

  return shader;
};

class ShaderCompilationFailure extends Error {
  constructor(shaderId, error) {
    super(`Failed to compile shader '${shaderId}': ${error}`);
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
    super(`Failed to link shader program ${shaderProgram.name}`);
  }
}
