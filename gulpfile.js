'use strict';

var glob       = require('glob');
var gulp       = require('gulp');
var gulpIf     = require('gulp-if');
var uglify     = require('gulp-uglify');
var plumber    = require('gulp-plumber');
var notify     = require('gulp-notify');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var buffer     = require('vinyl-buffer');
var minimist   = require('minimist');

// タスクの引数（環境情報）を取得
var options = minimist(process.argv.slice(2), {
  string:  ['env'],
  default: {
    env: 'development'
  }
});

gulp.task('js', function(callback){

  // JavaScriptファイルのからエントリーポイントのファイルを抽出
  var jsFiles = glob.sync( './src/js/{!(_)*.js,**/!(_)*/!(_)*.js}' );
  if (jsFiles.length === 0) {
    callback();
  }

  // タスクの終了を通知
  var task_num = jsFiles.length;
  var task_executed = 0;
  var onEnd = function () {
    if (task_num === ++task_executed) {
      callback();
    }
  };

  // browserify で結合
  jsFiles.forEach(function(file) {
    var fileName = file.replace(/.+\/(.+\.js)/, '$1');
    var filePath = file.replace(new RegExp('./src/(.*)/.+\.js'), '$1');
    browserify({
      entries: file,
      debug: options.env === 'development' ? true : false
    })
      .bundle()
      .on('end', onEnd)
      .pipe(source(fileName))
      .pipe(buffer())
      .pipe(plumber({
        errorHandler: notify.onError('<%= error.message %>')
       }))
      .pipe(gulpIf(
        options.env === 'staging' || options.env === 'production',
        uglify({ preserveComments: 'some' })
      ))
      .pipe(gulp.dest('./dist/'+filePath))
    ;
  });

});
