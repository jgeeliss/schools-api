# schools-api

A simple RESTful API for managing schools, school boards, and umbrella organizations and courses using Node.js, Express, and MongoDB.

## Installation
1. npm install
2. Set up a MongoDB database (local or cloud)
3. Create a ./config/config.js file based on ./config/config.example.js and fill in your MongoDB connection string
4. Optionally, seed the database with initial data:
   ```bash
    npm run seed
   ```
5. npm start

## Features
- Create, read, update, and delete organisations & courses
- Support for schools, school boards and umbrella organizations
- Validation and error handling
- UUIDs for unique identification of organisations and courses

## Organisations
### create an organisation
```bash
curl -X POST http://localhost:3000/organisations \
-H "Content-Type: application/json" \
-d '{
  "name": "Voorbeeld School",
  "type": "school",
  "email": "info@voorbeeld.be",
  "telephone": "+32 123456789",
  "belongsTo": "some-board-or-umbrella-uuid"
}'
```

Users can also create an organisation by using the web forms at `http://localhost:3000/organisations/new`. (Which makes it easier to add the "belongsTo" relationship.)

### update a Organisation
```bash
curl -X PUT http://localhost:3000/organisations/{organisation_id} \
-H "Content-Type: application/json" \
-d '{
  "name": "Bijgewerkte Organisation Naam",
  "email": "updated@example.com",
  "belongsTo": "new-board-or-umbrella-uuid"
}'
```

### get all organisations
```bash
curl http://localhost:3000/organisations
```

### get organisations by type
```bash
curl http://localhost:3000/organisations?type=board
```

### get organisations with pagination
Use `limit` and `offset` query parameters to paginate results:
```bash
# Get first 10 organisations
curl http://localhost:3000/organisations?limit=10

# Get next 10 organisations (skip first 10)
curl http://localhost:3000/organisations?limit=10&offset=10

# Get 5 organisations of type 'school'
curl http://localhost:3000/organisations?type=school&limit=5

# Skip first 20 and get next 10
curl http://localhost:3000/organisations?limit=10&offset=20
```

### get an organisation by ID
```bash
curl http://localhost:3000/organisations/{organisation_id}
```

### delete an organisation by ID
```bash
curl -X DELETE http://localhost:3000/organisations/{organisation_id}
```

### get all courses
```bash
curl http://localhost:3000/courses
```

## Courses

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

Users can also create a course by using the web form at `http://localhost:3000/courses/new`. (Which makes it easier to add the "school" relationship.)

### update a course
```bash
curl -X PUT http://localhost:3000/courses/{course_id} \
-H "Content-Type: application/json" \
-d '{
  "name": "Bijgewerkte Cursus Naam",
  "subject": "Natuurwetenschappen",
  "year": 2,
  "school": "another-school-uuid",
  "teacher": "Piet Pietersen"
}'
```

### get courses by year
```bash
curl http://localhost:3000/courses?year={year}
```

### get a course by ID
```bash
curl http://localhost:3000/courses/{course_id}
```

### delete a course by ID
```bash
curl -X DELETE http://localhost:3000/courses/{course_id}
```
