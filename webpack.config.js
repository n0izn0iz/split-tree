const path = require("path");

module.exports = {
  entry: "./sources/gfx-test.js",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
      {
        test: /\.(glsl|frag|vert)$/,
        exclude: /node_modules/,
        use: "webpack-glsl-loader"
      }
    ]
  }
};
