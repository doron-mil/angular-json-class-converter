const path = require('path');
const express = require('express');
const app = express();
// Run the app by serving the static files
// in the dist directory

// console.log( __dirname , path.join(__dirname, '../../dist'))
app.use(express.static(path.join(__dirname, '../../dist_test')));
// app.use(express.static(path.join(__dirname, '/dist')));

// Start the app by listening on the default
// Heroku port
app.listen(8080);
