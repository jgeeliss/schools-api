var express = require('express');
var router = express.Router();
const Organisation = require('../models/organisation');
const Course = require('../models/course');
const Uuid = require('uuid');

/* GET form to create new school */
router.get('/new', async function(req, res, next) {
  try {
    // note: $in operator to filter by multiple types
    // source: https://kb.objectrocket.com/mongo-db/the-mongoose-in-operator-1015
    // note: we fetch both boards and umbrellas as possible parents and pass them to the view
    const organisations = await Organisation.find({ type: { $in: ['board', 'umbrella'] } });
    res.render('create-school', {
      organisations: organisations
    });
  } catch (error) {
    next(error);
  }
});

/* GET all organisations */
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

    const organisations = await Organisation.find(query);
    res.json(organisations);
  } catch (error) {
    next(error);
  }
});

/* GET school by UUID (permalink) */
router.get('/:uuid', async function(req, res, next) {
  try {
    const school = await Organisation.findById(req.params.uuid);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json(school);
  } catch (error) {
    next(error);
  }
});

async function checkIfParentIsOfValidType(schoolType, belongsToId) {
    if (belongsToId) {
      const parentSchool = await Organisation.findById(belongsToId);
      if (!parentSchool) {
        return { message: 'Parent school not found' };
      }

      if (schoolType === 'school' && parentSchool.type !== 'board') {
        return { message: 'A school can only belong to a board' };
      }

      if (schoolType === 'board' && parentSchool.type !== 'umbrella') {
        return { message: 'A board can only belong to an umbrella' };
      }

      if (schoolType === 'umbrella') {
        return { message: 'An umbrella cannot belong to something else' };
      }
    }
}

/* POST create new school */
router.post('/', async function(req, res, next) {
  try {
    req.body._id = Uuid.v4();

    // Validate that 'belongsTo' follows the hierarchy: school -> board -> umbrella
    const parentTypeError = await checkIfParentIsOfValidType(req.body.type, req.body.belongsTo);
    if (parentTypeError) {
      return res.status(400).json(parentTypeError);
    }

    const school = await Organisation.create(req.body);
    res.status(201).json(school);
  } catch (error) {
    next(error);
  }
});

/* PUT update school by UUID (permalink) */
router.put('/:uuid', async function(req, res, next) {
  try {
    // Don't allow updating _id
    if (req.body._id) {
      return res.status(400).json({ message: 'Cannot change school ID' });
    }

    const school = await Organisation.findById(req.params.uuid);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    // validate 'belongsTo' hierarchy. If 'type' is not provided in the update, use the existing school's type
    const parentTypeError = await checkIfParentIsOfValidType(req.body.type || school.type, req.body.belongsTo);
    if (parentTypeError) {
      return res.status(400).json(parentTypeError);
    }

    // Update the school
    const updatedSchool = await Organisation.findByIdAndUpdate(
      req.params.uuid,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedSchool);
  } catch (error) {
    next(error);
  }
});

/* DELETE school by UUID (permalink) */
router.delete('/:uuid', async function(req, res, next) {
  try {
    const school = await Organisation.findById(req.params.uuid);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Check if any organisations belong to this organisation
    const childOrganisations = await Organisation.countDocuments({ belongsTo: req.params.uuid });
    if (childOrganisations > 0) {
      return res.status(400).json({
        message: 'Cannot delete organisation with child organisations. Please delete or reassign child organisations first.',
        // TODO: need to be add an update route for organisations!
        // inform how many child organisations exist:
        numberOfChildOrganisations: childOrganisations
      });
    }

    // Check if any courses belong to this organisation
    const coursesCount = await Course.countDocuments({ organisation: req.params.uuid });
    if (coursesCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete organisation with courses. Please delete or reassign courses first.',
        // TODO: need to be add an update route for courses too!
        numberOfCourses: coursesCount
      });
    }

    // no children or courses, delete the organisation
    await Organisation.findByIdAndDelete(req.params.uuid);
    res.json({ message: 'Organisation deleted successfully', organisation: organisation });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
