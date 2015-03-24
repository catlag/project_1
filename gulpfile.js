var gulp        = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');
var reload      = browserSync.reload;

// // Static server
// gulp.task('serve', function() {
//     browserSync({
//         server: {
//             baseDir: "./app.js"
//         }
//     });

//     gulp.watch("**/*.scss").on('change', reload);
//     gulp.watch("**/*.erb").on('change', reload);
// });


// gulp.task('default', ['serve']);

// gulp.task('nodemon', function (cb) {
// 	return nodemon({
// 	  script: 'app.js'
// 	}).on('start', function () {
//       cb();
//   });
// });

gulp.task('watch', function(){
	gulp.watch("views/*.ejs");
});

gulp.task('default', ['browser-sync'], function () {
});
 
gulp.task('browser-sync', ['nodemon'], function() {
	browserSync.init(null, {
		proxy: "http://localhost:5000",
        files: ["views/*.ejs"],
        browser: "google chrome",
        port: 3000,
	});
	
});
 
gulp.task('nodemon', function (cb) {
	return nodemon({
	  script: 'app.js'
	}).on('start', function () {
      
  }).on('change', ['watch'])
  .on('restart', function () {
      console.log('restarted!');
    });
});
