const express = require('express');
const router = express.Router();

/* GET home page - redirect to resources */
router.get('/', function(req, res, next) {
  res.redirect('/resources');
});

/* GET resources page - show available API routes */
router.get('/resources', function(req, res, next) {
  const resources = {
    "organisations": {
      "href": "/organisations",
      "description": "Schools, boards, and umbrellas",
      "methods": {
        "GET": {
          "description": "Get all organisations (supports ?type=school|board|umbrella)"
        },
        "POST": {
          "description": "Create a new organisation"
        }
      }
    },
    "organisations/new": {
      "href": "/organisations/new",
      "description": "Form to create a new organisation"
    },
    "organisations/:uuid": {
      "href": "/organisations/:uuid",
      "description": "Individual organisation resource",
      "methods": {
        "GET": {
          "description": "Get a specific organisation by UUID"
        },
        "PUT": {
          "description": "Update an organisation by UUID"
        },
        "DELETE": {
          "description": "Delete an organisation by UUID"
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
