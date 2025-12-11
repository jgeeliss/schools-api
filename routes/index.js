const express = require('express');
const router = express.Router();

/* GET home page - redirect to resources */
router.get('/', function(req, res, next) {
  res.redirect('/resources');
});

/* GET resources page - show available API routes */
router.get('/resources', function(req, res, next) {
  const resources = {
    "schools": {
      "href": "/schools",
      "description": "Schools, boards, and umbrellas",
      "methods": {
        "GET": {
          "description": "Get all schools (supports ?type=school|board|umbrella)"
        },
        "POST": {
          "description": "Create a new school"
        }
      }
    },
    "schools/new": {
      "href": "/schools/new",
      "description": "Form to create a new school"
    },
    "schools/:uuid": {
      "href": "/schools/:uuid",
      "description": "Individual school resource",
      "methods": {
        "GET": {
          "description": "Get a specific school by UUID"
        },
        "PUT": {
          "description": "Update a school by UUID"
        },
        "DELETE": {
          "description": "Delete a school by UUID"
        }
      }
    },
    "courses": {
      "href": "/courses",
      "description": "Courses",
      "methods": {
        "GET": {
          "description": "Get all courses (supports ?year=N)"
        },
        "POST": {
          "description": "Create a new course"
        }
      }
    },
    "courses/:uuid": {
      "href": "/courses/:uuid",
      "description": "Individual course resource",
      "methods": {
        "GET": {
          "description": "Get a specific course by UUID"
        },
        "PUT": {
          "description": "Update a course by UUID"
        },
        "DELETE": {
          "description": "Delete a course by UUID"
        }
      }
    }
  };

  res.json(resources);
});

module.exports = router;
