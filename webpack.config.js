module.exports = {
  entry: "./example/client/index.js",
  output: {
    path: __dirname,
    filename: "example/client/bundle.js"
  },
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        loaders: [
          require.resolve('babel-loader')
        ]
      },
      { test: /\.json$/, loader: 'json-loader'}
    ]
  }
};