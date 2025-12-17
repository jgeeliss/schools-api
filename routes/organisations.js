var express = require('express');
var router = express.Router();
const Organisation = require('../models/organisation');
const Course = require('../models/course');
const Uuid = require('uuid');

/* GET form to create new organisation */
router.get('/new', async function(req, res, next) {
  try {
    // note: $in operator to filter by multiple types
    // source: https://kb.objectrocket.com/mongo-db/the-mongoose-in-operator-1015
    // note: we fetch both boards and umbrellas as possible parents and pass them to the view
    const organisations = await Organisation.find({ type: { $in: ['board', 'umbrella'] } });
    res.render('create-organisation', {
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

    // only allow 'type', 'limit', and 'offset' as query parameters
    const queryKeys = Object.keys(req.query);
    const allowedParams = ['type', 'limit', 'offset'];
    const invalidParams = queryKeys.filter(key => !allowedParams.includes(key));
    
    if (invalidParams.length > 0) {
      return res.status(400).json({ 
        message: `Invalid query parameters. Only "type", "limit", and "offset" are allowed.` 
      });
    }

    // note: filter by type if provided in query string
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Parse limit and offset with defaults
    const limit = parseInt(req.query.limit) || 0; // 0 means no limit
    const offset = parseInt(req.query.offset) || 0;

    // Validate limit and offset are non-negative
    if (limit < 0 || offset < 0) {
      return res.status(400).json({ 
        message: 'Limit and offset must be non-negative numbers.' 
      });
    }

    let organisationsQuery = Organisation.find(query).skip(offset);
    
    if (limit > 0) {
      organisationsQuery = organisationsQuery.limit(limit);
    }

    const organisations = await organisationsQuery;
    res.json(organisations);
  } catch (error) {
    next(error);
  }
});

/* GET organisation by UUID (permalink) */
router.get('/:uuid', async function(req, res, next) {
  try {
    const organisation = await Organisation.findById(req.params.uuid);
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }
    res.json(organisation);
  } catch (error) {
    next(error);
  }
});

async function checkIfParentIsOfValidType(organisationType, belongsToId) {
    if (belongsToId) {
      const parentOrganisation = await Organisation.findById(belongsToId);
      if (!parentOrganisation) {
        return { message: 'Parent organisation not found' };
      }

      if (organisationType === 'school' && parentOrganisation.type !== 'board') {
        return { message: 'A school can only belong to a board' };
      }

      if (organisationType === 'board' && parentOrganisation.type !== 'umbrella') {
        return { message: 'A board can only belong to an umbrella' };
      }

      if (organisationType === 'umbrella') {
        return { message: 'An umbrella cannot belong to something else' };
      }
    }
}

/* POST create new organisation */
router.post('/', async function(req, res, next) {
  try {
    req.body._id = Uuid.v4();

    // Validate that 'belongsTo' follows the hierarchy: school -> board -> umbrella
    const parentTypeError = await checkIfParentIsOfValidType(req.body.type, req.body.belongsTo);
    if (parentTypeError) {
      return res.status(400).json(parentTypeError);
    }

    const organisation = await Organisation.create(req.body);
    res.status(201).json(organisation);
  } catch (error) {
    next(error);
  }
});

/* PUT update organisation by UUID (permalink) */
router.put('/:uuid', async function(req, res, next) {
  try {
    // Don't allow updating _id
    if (req.body._id) {
      return res.status(400).json({ message: 'Cannot change organisation ID' });
    }

    const organisation = await Organisation.findById(req.params.uuid);
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
    }
    // validate 'belongsTo' hierarchy. If 'type' is not provided in the update, use the existing organisation's type
    const parentTypeError = await checkIfParentIsOfValidType(req.body.type || organisation.type, req.body.belongsTo);
    if (parentTypeError) {
      return res.status(400).json(parentTypeError);
    }

    // Update the organisation
    const updatedOrganisation = await Organisation.findByIdAndUpdate(
      req.params.uuid,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedOrganisation);
  } catch (error) {
    next(error);
  }
});

/* DELETE organisation by UUID (permalink) */
router.delete('/:uuid', async function(req, res, next) {
  try {
    const organisation = await Organisation.findById(req.params.uuid);
    if (!organisation) {
      return res.status(404).json({ message: 'Organisation not found' });
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
