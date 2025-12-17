var express = require('express');
var router = express.Router();
const Course = require('../models/course');
const Organisation = require('../models/organisation');
const Uuid = require('uuid');

/* GET form to create new course */
router.get('/new', async function (req, res, next) {
  try {
    // note: $in operator to filter by multiple types
    // source: https://kb.objectrocket.com/mongo-db/the-mongoose-in-operator-1015
    // note: we fetch both boards and umbrellas as possible parents and pass them to the view
    const schools = await Organisation.find({ type: { $in: ['school'] } });
    res.render('create-course', {
      schools: schools
    });
  } catch (error) {
    next(error);
  }
});

/* GET all courses */
router.get('/', async function (req, res, next) {
  try {
    const query = {};

    // only allow 'year' as query parameter
    const queryKeys = Object.keys(req.query);
    if (queryKeys.length > 0 && (queryKeys.length > 1 || queryKeys[0] !== 'year')) {
      return res.status(400).json({ message: 'Invalid query parameters. Only "year" is allowed.' });
    }

    // note: filter by year if provided in query string
    if (req.query.year) {
      query.year = req.query.year;
    }

    const courses = await Course.find(query);
    res.json(courses);
  } catch (error) {
    next(error);
  }
});

/* GET course by UUID (permalink) */
router.get('/:uuid', async function (req, res, next) {
  try {
    const course = await Course.findById(req.params.uuid);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    next(error);
  }
});

function validateSchoolExists(schoolId) {
  return Organisation.findById(schoolId);
}

function validateYearIsValid(year) {
  // TODO: define valid years in the config file
  const validYears = [1, 2, 3, 4, 5, 6];
  return validYears.includes(year);
}

function validateTeacherName(teacher) {
  // Check if teacher name contains any numbers
  const regex = /\d/;
  return teacher && !regex.test(teacher);
}

async function validateCourseData(courseData) {
  if (courseData.school && !await validateSchoolExists(courseData.school)) {
    return { message: 'Parent school not found' };
  }
  if (courseData.year != null && !validateYearIsValid(Number(courseData.year))) {
    return { message: 'Invalid year' };
  }
  if (courseData.teacher && !validateTeacherName(courseData.teacher)) {
    return { message: 'Teacher name cannot contain numbers' };
  }
  return null; // Return null when validation passes
}

/* POST create new course */
router.post('/', async function (req, res, next) {
  try {
    // Validate before setting _id
    const validationError = await validateCourseData(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    req.body._id = Uuid.v4();
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
});

/* PUT update course by UUID */
router.put('/:uuid', async function (req, res, next) {
  try {
    // Don't allow updating _id
    if (req.body._id) {
      return res.status(400).json({ message: 'Cannot change course ID' });
    }

    const course = await Course.findById(req.params.uuid);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const validationError = await validateCourseData(req.body);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    // Update the course
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.uuid,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedCourse);
  } catch (error) {
    next(error);
  }
});

/* DELETE course by UUID (permalink) */
router.delete('/:uuid', async function (req, res, next) {
  try {
    const course = await Course.findByIdAndDelete(req.params.uuid);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully', course: course });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
