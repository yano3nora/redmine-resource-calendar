const path                 = require('path')
const glob                 = require('glob')
const globImporter         = require('node-sass-glob-importer')
const webpack              = require('webpack')
const autoprefixer         = require('autoprefixer')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const BrowserSyncPlugin    = require('browser-sync-webpack-plugin')
const HtmlWebpackPlugin    = require('html-webpack-plugin')
const fs                   = require('fs')
require('dotenv').config()

/**
 * generateHtmlPlugins
 *
 * Custom plugin for converting multiple template files,
 * using with html-webpack-plugin.
 *
 * @see https://extri.co/2017/07/11/generating-multiple-html-pages-with-htmlwebpackplugin/
 */
function generateHtmlPlugins (templateDir) {
  const templateFiles = fs.readdirSync(path.resolve(__dirname, templateDir))
  return templateFiles.map(item => {
    const parts = item.split('.')
    const name = parts[0]
    const extension = parts[1]
    return new HtmlWebpackPlugin({
      filename: `${name}.html`,
      template: path.resolve(__dirname, `${templateDir}/${name}.${extension}`),
      inject: false,
    })
  })
}
const htmlPlugins = generateHtmlPlugins('./src/templates')

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
      '@babel/polyfill/noConflict',
      './src/index.js',
      ...glob.sync('./src/bases/**/*.js',      { ignored: './**/_*.js' }),
      ...glob.sync('./src/components/**/*.js', { ignored: './**/_*.js' }),
      ...glob.sync('./src/modules/**/*.js',    { ignored: './**/_*.js' }),
    ],
  },
  output: {
    path: path.join(__dirname, 'dist/'),
    filename: 'redmine-resource-calendar.js',
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
      {
        test: /\.ejs$/,
        use: [
          'html-loader',
          'ejs-html-loader',
        ],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        USERS:    JSON.stringify(process.env.USERS),
        URL:      JSON.stringify(process.env.URL),
        API_KEY:  JSON.stringify(process.env.API_KEY),
        WORKLOAD: JSON.stringify(process.env.WORKLOAD),
      }
    }),
    new MiniCssExtractPlugin({
      filename: './redmine-resource-calendar.css',
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
        baseDir: './dist',
        index: 'index.html',
      },
      cors: true,
      reloadDelay: 0,  // edit
      injectChanges: true,
      injectCss: true,
      open: false,
      watchOptions: {
        awaitWriteFinish : true,
        ignoreInitial: true,
        ignored: ['/node_modules/'],  // edit
      },
      files: [  // edit
        'src/**/*.ejs',
        'src/**/*.js',
        'dist/**/*.css',
      ],
    },
    {
      reload: false,
    }),
  ].concat(htmlPlugins),
}
