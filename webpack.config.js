const path                 = require('path')
const glob                 = require('glob')
const globImporter         = require('node-sass-glob-importer')
const webpack              = require('webpack')
const autoprefixer         = require('autoprefixer')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const BrowserSyncPlugin    = require('browser-sync-webpack-plugin')

module.exports = {
  watchOptions: {
    ignored: ['node_modules'],
  },
  devtool: process.env.npm_lifecycle_event === 'build'
    ? 'source-map'
    : 'cheap-module-eval-source-map',
  performance: { hints: false },
  entry: {
    bundle: [
      './src/index.scss',
      './src/index.js',
      ...glob.sync('./src/bases/**/*.js',      { ignored: './**/_*.js' }),
      ...glob.sync('./src/components/**/*.js', { ignored: './**/_*.js' }),
      ...glob.sync('./src/modules/**/*.js',    { ignored: './**/_*.js' }),
    ],
  },
  output: {
    path: path.join(__dirname, 'sample/'),
    filename: '[name].js',
  },
  resolve: {
    alias: {
      bases:       path.resolve(__dirname, 'src/bases'),
      components:  path.resolve(__dirname, 'src/components'),
      modules:     path.resolve(__dirname, 'src/modules'),
    },
    extensions: ['.wasm', '.mjs', '.js', '.json', '.jsx', '.css', '.scss'],
    modules: ['node_modules'],
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          {
            loader: 'css-loader',
            options: {
              // url: false,  // Deny fetching resource by url().
              minimize: (process.env.npm_lifecycle_event === 'build'),
              importLoaders: 2,  // For PostCSS + Sass.
              sourceMap: true,
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: [
                autoprefixer({
                  browsers: ['last 2 versions'],
                  add: true,
                  flexbox: true,
                  grid: true,
                  remove: false,
                }),
              ],
              sourceMap: true,
            },
          },
          {
            loader: 'sass-loader',
            options: {
              importer: globImporter(),
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: 'url-loader',
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: 'url-loader',
      },
      {
        test: /\.js$|\.jsx$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env',
                {
                  modules: false,
                  targets: {
                    chrome: 69,
                    firefox: 62,
                    safari: 12,
                    edge: 17,
                    ie: 11,
                    ios: 10,
                    android: 7,
                  },
                },
              ],
              ['@babel/preset-react'],
            ],
          },
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: './bundle.css',
    }),
    new webpack.ProvidePlugin({
      moment: 'moment',
      React: 'react',
      ReactDOM: 'react-dom',
      PropTypes: 'prop-types',
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.WatchIgnorePlugin([
      path.resolve(__dirname, './node_modules'),
    ]),
    new BrowserSyncPlugin({
      host: 'localhost',
      port: 3000,
      server: {
        baseDir: './sample',
        index: 'index.html',
      },
      cors: true,
      reloadDelay: 500,  // edit
      injectChanges: true,
      watchOptions: {
        awaitWriteFinish : true,
        ignoreInitial: true,
        ignored: ['/node_modules/'],  // edit
      },
      files: [  // edit
        'sample/*.html',
        'src/**/*.js',
        'sample/*.css',
      ],
    },
    {
      reload: false,
    }),
  ],
}
