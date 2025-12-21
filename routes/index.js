const express = require('express');
const router = express.Router();

/* GET home page - redirect to resources */
router.get('/', function(req, res, next) {
  res.redirect('/resources');
});

/* GET resources page - show available API routes */
router.get('/resources', function(req, res, next) {
  res.render('resources');
});

module.exports = router;
