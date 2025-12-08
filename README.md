# schools-api

A simple RESTful API for managing schools, school boards, and umbrella organizations using Node.js, Express, and MongoDB.

## Features
- Create, read, update, and delete schools
- Support for school boards and umbrella organizations
- Validation and error handling
- UUIDs for unique identification of schools

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

Users can also create a school by using the web form at `http://localhost:3000/schools/new`.

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