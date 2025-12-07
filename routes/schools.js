var express = require('express');
var router = express.Router();
const School = require('../models/school');
const Uuid = require('uuid');

/* GET form to create new school */
router.get('/new', function(req, res, next) {
  res.render('create-school');
});

/* GET all schools */
router.get('/', async function(req, res, next) {
  try {
    const schools = await School.find({});
    res.json(schools);
  } catch (error) {
    next(error);
  }
});

/* GET school by UUID (permalink) */
router.get('/:uuid', async function(req, res, next) {
  try {
    const school = await School.findOne({ permalink: req.params.uuid });
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    next(error);
  }
});

/* POST create new school */
router.post('/', async function(req, res, next) {
  try {
    req.body.permalink = Uuid.v4();
    const school = await School.create(req.body);
    res.status(201).json(school);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
