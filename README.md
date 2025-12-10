# schools-api

A simple RESTful API for managing schools, school boards, and umbrella organizations and courses using Node.js, Express, and MongoDB.

## Features
- Create, read, update, and delete schools & courses
- Support for school boards and umbrella organizations
- Validation and error handling
- UUIDs for unique identification of schools and courses

### create a school
```bash
curl -X POST http://localhost:3000/schools \
-H "Content-Type: application/json" \
-d '{
  "name": "Voorbeeld School",
  "type": "school",
  "email": "info@voorbeeld.be",
  "telephone": "+32 123456789"
}'
```

### create a course
```bash
curl -X POST http://localhost:3000/courses \
-H "Content-Type: application/json" \
-d '{
  "name": "Voorbeeld Cursus",
  "subject": "Wiskunde",
  "year": 1,
  "teacher": "Jan Jansen",
  "school": "some-school-uuid"
}'
```

Users can also create a school or a course by using the web forms at `http://localhost:3000/schools/new` and `http://localhost:3000/courses/new`.

### get all schools
```bash
curl http://localhost:3000/schools
```

### get schools by type
```bash
curl http://localhost:3000/schools?type=board
```

### get a school by ID
```bash
curl http://localhost:3000/schools/{school_id}
```

### get all courses
```bash
curl http://localhost:3000/courses
```

### get courses by year
```bash
curl http://localhost:3000/courses?year={year}
```

### get a course by ID
```bash
curl http://localhost:3000/courses/{course_id}
```
