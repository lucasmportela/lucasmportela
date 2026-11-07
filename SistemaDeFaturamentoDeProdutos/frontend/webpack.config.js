const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/index.jsx",
  output: { path: path.resolve(__dirname, "dist"), filename: "bundle.js", clean: true },
  module: { rules: [
    { test: /\.jsx?$/, exclude: /node_modules/, use: {
      loader: "babel-loader",
      options: { presets: [["@babel/preset-env", { targets: "defaults" }], ["@babel/preset-react", { runtime: "automatic" }]] }
    }},
    { test: /\.css$/, use: ["style-loader", "css-loader"] }
  ]},
  resolve: { extensions: [".js", ".jsx"] },
  plugins: [new HtmlWebpackPlugin({ template: "./public/index.html" })],
  devServer: {
    static: { directory: path.join(__dirname, "dist") },
    port: 3000, open: true,
    proxy: [{ context: ["/api"], target: "http://127.0.0.1:5000", changeOrigin: true }]
  }
};
