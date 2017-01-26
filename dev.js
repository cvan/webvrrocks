var fs = require('fs');
var path = require('path');
var urllib = require('url');

var budo = require('budo');
var shell = require('shelljs');
var yonder = require('yonder');

var OPTS = {
  assets: {
    glob: {
      strict: true,
      cwd: path.resolve(__dirname, 'public'),
      include: '**/*',
      ignore: '**/*.html',
      nonull: true
    },
    inputDir: path.resolve(__dirname, 'public'),
    outputDir: path.resolve(__dirname, '_prod')
  },
  nunjucks: {
    glob: {
      include: '**/*.html',
    },
    extensionsFile: path.resolve(__dirname, 'nunjucks-helpers.js'),
    inputDir: path.resolve(__dirname, 'public'),
    outputDir: path.resolve(__dirname, '_prod')
  }
};
OPTS.routerPath = path.join(OPTS.assets.inputDir, 'ROUTER');

/**
 * Serves nice URLs (à la GitHub Pages & Surge).
 *
 * For example, `/firefox` will be served from `/firefox.html`, and
 * `/firefox/` will be served from `/firefox/index.html`,
 * preserving the URLs.
 */
function staticMiddlewareForFilesWithoutTrailingSlashes (req, res, next) {
  var parsedUrl = urllib.parse(req.url);
  var pathname = parsedUrl.pathname;
  var ext = path.extname(pathname);
  if (ext || pathname.substr(-1) === '/') {
    next();
    return;
  }
  var fileRelative = path.join(OPTS.assets.inputDir, pathname + '.html');
  fs.exists(fileRelative, function (exists) {
    if (exists) {
      req.url = pathname + '.html' + (parsedUrl.search || '') + (parsedUrl.hash || '');
    }
    next();
  });
}

var budoLiveOpts = {
  // For faster development, re-bundle the LiveReload client
  // on each request.
  cache: false,
  // Include source mapping in the LiveReload client.
  debug: true,
  // Enable file watching and LiveReload.
  live: true,
  // Additional script(s) to include after the LiveReload client.
  // include: require.resolve('./live-client.js')
};
var budoMiddleware = [staticMiddlewareForFilesWithoutTrailingSlashes];

// Create server-side redirects (defined in the `ROUTER` file).
// See https://github.com/sintaxi/yonder#readme for usage.
if (fs.existsSync(OPTS.routerPath)) {
  budoMiddleware.push(yonder.middleware(OPTS.routerPath));
}

function regenerateAllNunjucksTemplates () {
  return shell.exec(`node ./node_modules/.bin/nunjucks "${OPTS.nunjucks.glob.include}" --path ${OPTS.nunjucks.inputDir} --unsafe --extensions ${OPTS.nunjucks.extensionsFile} --out ${OPTS.nunjucks.outputDir}`);
}

var jsFileEntry = path.join(OPTS.assets.inputDir, 'media', 'js', 'main.js');

var app = budo(jsFileEntry, {
  dir: OPTS.assets.outputDir,
  port: process.env.WEBVRROCKS_PORT || process.env.PORT || 3000,
  // host: 'localhost',
  serve: path.join(OPTS.assets.outputDir, 'media', 'js', 'main.js'),
  cors: true,
  live: budoLiveOpts,
  watchGlob: '**.{html,css,svg,jpg,png,json}',
  middleware: budoMiddleware
});

app.on('connect', function (evt) {
  console.log('connected')
    var wss = evt.webSocketServer;

    // Receiving messages from clients.
    wss.on('connection', function (socket) {
      console.log('[LiveReload] Client Connected')
      // socket.on('message', function (message) {
      //   console.log('[LiveReload] Message from client:', JSON.parse(message));
      // });
    });

    shell.rm('-rf', OPTS.assets.outputDir, OPTS.nunjucks.outputDir);
    shell.cp('-R', OPTS.assets.inputDir, OPTS.assets.outputDir);
    regenerateAllNunjucksTemplates();
  })
  .on('reload', function (file) {
    if (path.normalize(file) === path.normalize(jsFileEntry)) {
      console.log('Skipping bundle');
      return;
    }
    var ext = path.extname(file).toLowerCase();
    var fileRelative;
    if (ext === '.html') {
      fileRelative = path.relative(OPTS.nunjucks.inputDir, file);
    } else {
      fileRelative = path.relative(OPTS.assets.inputDir, file);
    }
    var parentDir = fileRelative.split(path.sep)[0];
    if (parentDir) {
      parentDir = path.join(__dirname, parentDir.toLowerCase());
    }
    console.log('reload', file, parentDir);

    if (!parentDir ||
        parentDir === OPTS.assets.outputDir ||
        parentDir === OPTS.nunjucks.outputDir) {
      // Do not reload files in `_prod/` directory.
      return;
    }

    console.log('File reloaded:', file);

    if (ext === '.html') {
      fileRelative = path.relative(OPTS.nunjucks.inputDir, fileRelative);
      if (fileRelative[0] === '_') {
        regenerateAllNunjucksTemplates();
        return;
      }
      shell.exec(`node ./node_modules/.bin/nunjucks ${fileRelative} --path ${OPTS.nunjucks.inputDir} --unsafe --extensions ${OPTS.nunjucks.extensionsFile} --out ${OPTS.nunjucks.outputDir}`);
    }
    if (ext === '.json') {
      console.log('regenerate', ext);
      regenerateAllNunjucksTemplates();
      return;
    }
    var fileOutput = path.relative(OPTS.assets.outputDir, fileRelative);
    console.log('>>>', OPTS.assets.outputDir, fileOutput, fileRelative);
    var fileOutputDir = path.dirname(fileOutput);
    console.log('Copying: %s', fileRelative, fileOutput);
    // shell.mkdir('-p', fileOutputDir);
    // shell.cp(file, fileOutput);
  });

module.exports = app;
