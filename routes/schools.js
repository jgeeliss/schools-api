var express = require('express');
var router = express.Router();
const School = require('../models/school');
const Uuid = require('uuid');

/* GET form to create new school */
router.get('/new', async function(req, res, next) {
  try {
    // note: $in operator to filter by multiple types
    // source: https://kb.objectrocket.com/mongo-db/the-mongoose-in-operator-1015
    // note: we fetch both boards and umbrellas as possible parents and pass them to the view
    const schools = await School.find({ type: { $in: ['board', 'umbrella'] } });
    res.render('create-school', {
      schools: schools
    });
  } catch (error) {
    next(error);
  }
});

/* GET all schools */
router.get('/', async function(req, res, next) {
  try {
    const query = {};

    // only allow 'type' as query parameter
    const queryKeys = Object.keys(req.query);
    if (queryKeys.length > 0 && (queryKeys.length > 1 || queryKeys[0] !== 'type')) {
      return res.status(400).json({ message: 'Invalid query parameters. Only "type" is allowed.' });
    }

    // note: filter by type if provided in query string
    if (req.query.type) {
      query.type = req.query.type;
    }

    const schools = await School.find(query);
    res.json(schools);
  } catch (error) {
    next(error);
  }
});

/* GET school by UUID (permalink) */
router.get('/:uuid', async function(req, res, next) {
  try {
    const school = await School.findById(req.params.uuid);
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
    req.body._id = Uuid.v4();
    const school = await School.create(req.body);
    res.status(201).json(school);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
