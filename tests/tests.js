// source: https://medium.com/@ehtemam/writing-test-with-supertest-and-mocha-for-expressjs-routes-555d2910d2c2

const assert = require('assert');
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const Organisation = require('../models/organisation');
const Course = require('../models/course');
const fs = require('fs');
const path = require('path');
// set environment to 'test' to disable logging HTTP requests
process.env.NODE_ENV = 'test';

const configPath = path.join(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { user, password, host, clusterName } = config.databaseCredentials;
const uri = `mongodb+srv://${user}:${password}@${host}/?appName=${clusterName}`;

describe('School Validation Tests', function () {
    // Increase timeout for database operations
    this.timeout(10000);

    let testUmbrella, testBoard, testSchool;

    before(async function () {
        await mongoose.connect(uri);
        // Clean up test data
        await Organisation.deleteMany({ name: { $regex: /^TEST_/ } });
        await Organisation.deleteMany({ name: { $regex: /^API_TEST_/ } });
        testUmbrella = await Organisation.create({
            _id: 'api-test-umbrella',
            name: 'API_TEST_Umbrella',
            type: 'umbrella',
            email: 'api-umbrella@example.com',
            telephone: '1234567890'
        });

        testBoard = await Organisation.create({
            _id: 'api-test-board',
            name: 'API_TEST_Board',
            type: 'board',
            belongsTo: testUmbrella._id,
            email: 'api-board@example.com',
            telephone: '1234567890'
        });

        testSchool = await Organisation.create({
            _id: 'api-test-school',
            name: 'API_TEST_School',
            type: 'school',
            belongsTo: testBoard._id,
            email: 'api-school@example.com',
            telephone: '1234567890'
        });
    });

    after(async function () {
        // Clean up test data
        await Organisation.deleteMany({ name: { $regex: /^TEST_/ } });
        await Organisation.deleteMany({ name: { $regex: /^API_TEST_/ } });
        await mongoose.connection.close();
    });

    describe('School Model Tests', function () {
        describe('School Type Validation', function () {
            it('should reject invalid type', async function () {
                try {
                    await Organisation.create({
                        _id: 'test-invalid',
                        name: 'TEST_Invalid Type',
                        type: 'invalid_type',
                        email: 'test-invalid@example.com',
                        telephone: '1234567890'
                    });
                    assert.fail('Should have thrown validation error');
                } catch (error) {
                    assert(error.name === 'ValidationError');
                }
            });
        });

        describe('Required Fields Validation', function () {
            it('should require name', async function () {
                try {
                    await Organisation.create({
                        _id: 'test-geen-naam',
                        type: 'school',
                        email: 'test@example.com',
                        telephone: '1234567890'
                    });
                    assert.fail('Should have thrown validation error');
                } catch (error) {
                    assert(error.name === 'ValidationError');
                    assert(error.errors.name);
                }
            });

            it('should require email', async function () {
                try {
                    await Organisation.create({
                        _id: 'test-no-email',
                        name: 'TEST_No Email',
                        type: 'school',
                        telephone: '1234567890'
                    });
                    assert.fail('Should have thrown validation error');
                } catch (error) {
                    assert(error.name === 'ValidationError');
                    assert(error.errors.email);
                }
            });

            it('should require telephone', async function () {
                try {
                    await Organisation.create({
                        _id: 'test-no-phone',
                        name: 'TEST_No Phone',
                        type: 'school',
                        email: 'test@example.com'
                    });
                    assert.fail('Should have thrown validation error');
                } catch (error) {
                    assert(error.name === 'ValidationError');
                    assert(error.errors.telephone);
                }
            });

            it('should require type', async function () {
                try {
                    await Organisation.create({
                        _id: 'test-no-type',
                        name: 'TEST_No Type',
                        email: 'test@example.com',
                        telephone: '1234567890'
                    });
                    assert.fail('Should have thrown validation error');
                } catch (error) {
                    assert(error.name === 'ValidationError');
                    assert(error.errors.type);
                }
            });
        });

        describe('Email Lowercase Validation', function () {
            it('should convert email to lowercase', async function () {
                const school = await Organisation.create({
                    _id: 'test-email-case',
                    name: 'TEST_Email Case',
                    type: 'school',
                    email: 'TEST@EXAMPLE.COM',
                    telephone: '1234567890'
                });

                assert.strictEqual(school.email, 'test@example.com');
            });
        });
    });

    describe('School API Tests', function () {
        describe('POST /organisations - Hierarchy Validation', function () {
            it('should allow creating a school belonging to a board', async function () {
                const response = await request(app)
                    .post('/organisations')
                    .send({
                        name: 'API_TEST_Valid School',
                        type: 'school',
                        belongsTo: testBoard._id,
                        email: 'api-valid-school@example.com',
                        telephone: '1234567890'
                    })
                    .expect(201);

                assert.strictEqual(response.body.type, 'school');
                assert.strictEqual(response.body.belongsTo, testBoard._id);
            });

            it('should allow creating a board belonging to an umbrella', async function () {
                const response = await request(app)
                    .post('/organisations')
                    .send({
                        name: 'API_TEST_Valid Board',
                        type: 'board',
                        belongsTo: testUmbrella._id,
                        email: 'api-valid-board@example.com',
                        telephone: '1234567890'
                    })
                    .expect(201);

                assert.strictEqual(response.body.type, 'board');
                assert.strictEqual(response.body.belongsTo, testUmbrella._id);
            });

            it('should reject a school belonging to an umbrella', async function () {
                const response = await request(app)
                    .post('/organisations')
                    .send({
                        name: 'API_TEST_Invalid School',
                        type: 'school',
                        belongsTo: testUmbrella._id,
                        email: 'api-invalid-school@example.com',
                        telephone: '1234567890'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'A school can only belong to a board');
            });

            it('should reject a school belonging to another school', async function () {
                const response = await request(app)
                    .post('/organisations')
                    .send({
                        name: 'API_TEST_Invalid School 2',
                        type: 'school',
                        belongsTo: testSchool._id,
                        email: 'api-invalid-school2@example.com',
                        telephone: '1234567890'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'A school can only belong to a board');
            });

            it('should reject a board belonging to another board', async function () {
                const response = await request(app)
                    .post('/organisations')
                    .send({
                        name: 'API_TEST_Invalid Board',
                        type: 'board',
                        belongsTo: testBoard._id,
                        email: 'api-invalid-board@example.com',
                        telephone: '1234567890'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'A board can only belong to an umbrella');
            });

            it('should reject a board belonging to a school', async function () {
                const response = await request(app)
                    .post('/organisations')
                    .send({
                        name: 'API_TEST_Invalid Board 2',
                        type: 'board',
                        belongsTo: testSchool._id,
                        email: 'api-invalid-board2@example.com',
                        telephone: '1234567890'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'A board can only belong to an umbrella');
            });

            it('should reject an umbrella with a belongsTo value', async function () {
                const response = await request(app)
                    .post('/organisations')
                    .send({
                        name: 'API_TEST_Invalid Umbrella',
                        type: 'umbrella',
                        belongsTo: testUmbrella._id,
                        email: 'api-invalid-umbrella@example.com',
                        telephone: '1234567890'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'An umbrella cannot belong to something else');
            });

            it('should reject belongsTo with non-existent parent', async function () {
                const response = await request(app)
                    .post('/organisations')
                    .send({
                        name: 'API_TEST_Nonexistent Parent',
                        type: 'school',
                        belongsTo: 'nonexistent-id-12345',
                        email: 'api-nonexistent@example.com',
                        telephone: '1234567890'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'Parent school not found');
            });
        });

        describe('GET /organisations', function () {
            it('should get all organisations', async function () {
                const response = await request(app)
                    .get('/organisations')
                    .expect(200);

                assert(Array.isArray(response.body));
                assert(response.body.length > 0);
            });

            it('should filter organisations by type (umbrella)', async function () {
                const response = await request(app)
                    .get('/organisations?type=umbrella')
                    .expect(200);

                assert(Array.isArray(response.body));
                assert(response.body.length > 0);
                response.body.forEach(school => {
                    assert.strictEqual(school.type, 'umbrella');
                });
            });

            it('should filter organisations by type (board)', async function () {
                const response = await request(app)
                    .get('/organisations?type=board')
                    .expect(200);

                assert(Array.isArray(response.body));
                assert(response.body.length > 0);
                response.body.forEach(school => {
                    assert.strictEqual(school.type, 'board');
                });
            });

            it('should filter organisations by type (school)', async function () {
                const response = await request(app)
                    .get('/organisations?type=school')
                    .expect(200);

                assert(Array.isArray(response.body));
                assert(response.body.length > 0);
                response.body.forEach(school => {
                    assert.strictEqual(school.type, 'school');
                });
            });

            it('should reject invalid query parameters', async function () {
                const response = await request(app)
                    .get('/organisations?invalid=param')
                    .expect(400);

                assert.strictEqual(response.body.message, 'Invalid query parameters. Only "type" is allowed.');
            });

            it('should reject multiple query parameters', async function () {
                const response = await request(app)
                    .get('/organisations?type=school&name=test')
                    .expect(400);

                assert.strictEqual(response.body.message, 'Invalid query parameters. Only "type" is allowed.');
            });
        });

        describe('GET /organisations/:uuid', function () {
            it('should get a specific umbrella school', async function () {
                const response = await request(app)
                    .get(`/organisations/${testUmbrella._id}`)
                    .expect(200);

                assert.strictEqual(response.body._id, testUmbrella._id);
                assert.strictEqual(response.body.name, testUmbrella.name);
                assert.strictEqual(response.body.type, 'umbrella');
            });

            it('should get a specific board school', async function () {
                const response = await request(app)
                    .get(`/organisations/${testBoard._id}`)
                    .expect(200);

                assert.strictEqual(response.body._id, testBoard._id);
                assert.strictEqual(response.body.name, testBoard.name);
                assert.strictEqual(response.body.type, 'board');
                assert.strictEqual(response.body.belongsTo, testUmbrella._id);
            });

            it('should get a specific school', async function () {
                const response = await request(app)
                    .get(`/organisations/${testSchool._id}`)
                    .expect(200);

                assert.strictEqual(response.body._id, testSchool._id);
                assert.strictEqual(response.body.name, testSchool.name);
                assert.strictEqual(response.body.type, 'school');
                assert.strictEqual(response.body.belongsTo, testBoard._id);
            });

            it('should return 404 for non-existent school', async function () {
                const response = await request(app)
                    .get('/organisations/nonexistent-school-id')
                    .expect(404);

                assert.strictEqual(response.body.message, 'School not found');
            });
        });

        describe('PUT /organisations/:uuid - Hierarchy Validation', function () {
            it('should allow updating school to belong to a different board', async function () {
                const newBoard = await Organisation.create({
                    _id: 'api-test-new-board',
                    name: 'API_TEST_New Board',
                    type: 'board',
                    belongsTo: testUmbrella._id,
                    email: 'api-new-board@example.com',
                    telephone: '1234567890'
                });

                const response = await request(app)
                    .put(`/organisations/${testSchool._id}`)
                    .send({
                        belongsTo: newBoard._id
                    })
                    .expect(200);

                assert.strictEqual(response.body.belongsTo, newBoard._id);
            });

            it('should reject updating school to belong to an umbrella', async function () {
                const response = await request(app)
                    .put(`/organisations/${testSchool._id}`)
                    .send({
                        belongsTo: testUmbrella._id
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'A school can only belong to a board');
            });

            it('should reject updating board to belong to a school', async function () {
                const response = await request(app)
                    .put(`/organisations/${testBoard._id}`)
                    .send({
                        belongsTo: testSchool._id
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'A board can only belong to an umbrella');
            });

            it('should reject changing umbrella to have a parent', async function () {
                const response = await request(app)
                    .put(`/organisations/${testUmbrella._id}`)
                    .send({
                        belongsTo: testUmbrella._id
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'An umbrella cannot belong to something else');
            });

            it('should reject updating belongsTo to non-existent parent', async function () {
                const response = await request(app)
                    .put(`/organisations/${testSchool._id}`)
                    .send({
                        belongsTo: 'nonexistent-id-99999'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'Parent school not found');
            });
        });

    });

});

describe('Course Validation Tests', function () {
    this.timeout(10000);

    let testSchool, testCourse;

    before(async function () {
        await mongoose.connect(uri);
        await Course.deleteMany({ name: { $regex: /^TEST_COURSE_/ } });
        await Organisation.deleteMany({ name: { $regex: /^TEST_COURSE_SCHOOL/ } });

        testSchool = await Organisation.create({
            _id: 'test-course-school',
            name: 'TEST_COURSE_SCHOOL',
            type: 'school',
            email: 'test-course-school@example.com',
            telephone: '1234567890'
        });

        testCourse = await Course.create({
            _id: 'api-test-course',
            name: 'API_TEST_COURSE_Wiskunde',
            subject: 'Wiskunde',
            year: 1,
            teacher: 'Jan Leeraar',
            school: testSchool._id

        });
    });

    after(async function () {
        await Course.deleteMany({ name: { $regex: /^TEST_COURSE_/ } });
        await Organisation.deleteMany({ name: { $regex: /^TEST_COURSE_SCHOOL/ } });
        await Course.deleteMany({ name: { $regex: /^API_TEST_COURSE_/ } });
        await Organisation.deleteMany({ name: { $regex: /^API_TEST_COURSE_SCHOOL/ } });
        await Course.deleteMany({ name: { $regex: /^API_TEST_COURSE_/ } });
        await Organisation.deleteMany({ name: { $regex: /^API_TEST_COURSE_SCHOOL/ } });
        await mongoose.connection.close();
    });

    describe('Course Model Tests', function () {
        describe('Required Fields Validation', function () {
            it('should require name', async function () {
                try {
                    await Course.create({
                        _id: 'test-course-no-name',
                        subject: 'Wiskunde',
                        year: 1,
                        teacher: 'Jan Jansen',
                        school: testSchool._id
                    });
                    assert.fail('Should have thrown validation error');
                } catch (error) {
                    assert(error.name === 'ValidationError');
                    assert(error.errors.name);
                }
            });

            it('should require subject', async function () {
                try {
                    await Course.create({
                        _id: 'test-course-no-subject',
                        name: 'TEST_COURSE_Math 101',
                        year: 1,
                        teacher: 'Jan Jansen',
                        school: testSchool._id
                    });
                    assert.fail('Should have thrown validation error');
                } catch (error) {
                    assert(error.name === 'ValidationError');
                    assert(error.errors.subject);
                }
            });

            it('should require year', async function () {
                try {
                    await Course.create({
                        _id: 'test-course-no-year',
                        name: 'TEST_COURSE_Math 101',
                        subject: 'Wiskunde',
                        teacher: 'Jan Jansen',
                        school: testSchool._id
                    });
                    assert.fail('Should have thrown validation error');
                } catch (error) {
                    assert(error.name === 'ValidationError');
                    assert(error.errors.year);
                }
            });

            it('should require teacher', async function () {
                try {
                    await Course.create({
                        _id: 'test-course-no-teacher',
                        name: 'TEST_COURSE_Math 101',
                        subject: 'Wiskunde',
                        year: 1,
                        school: testSchool._id
                    });
                    assert.fail('Should have thrown validation error');
                } catch (error) {
                    assert(error.name === 'ValidationError');
                    assert(error.errors.teacher);
                }
            });
        });

        describe('Course Creation', function () {
            it('should create a course with all required fields', async function () {
                const course = await Course.create({
                    _id: 'test-course-valid',
                    name: 'TEST_COURSE_Valid Course',
                    subject: 'Science',
                    year: 3,
                    teacher: 'Julienne Reinders',
                    school: testSchool._id
                });

                assert.strictEqual(course.name, 'TEST_COURSE_Valid Course');
                assert.strictEqual(course.subject, 'Science');
                assert.strictEqual(course.year, 3);
                assert.strictEqual(course.teacher, 'Julienne Reinders');
                assert.strictEqual(course.school, testSchool._id);
            });
        });

        describe('Unique ID Validation', function () {
            it('should reject duplicate _id', async function () {
                const duplicateId = 'test-course-duplicate';

                await Course.create({
                    _id: duplicateId,
                    name: 'TEST_COURSE_First',
                    subject: 'Wiskunde',
                    year: 1,
                    teacher: 'Leeraar One',
                    school: testSchool._id
                });

                try {
                    await Course.create({
                        _id: duplicateId,
                        name: 'TEST_COURSE_Second',
                        subject: 'Wiskunde',
                        year: 1,
                        teacher: 'Leeraar Two',
                        school: testSchool._id
                    });
                    assert.fail('Should have thrown duplicate key error');
                } catch (error) {
                    assert(error.code === 11000);
                }
            });
        });
    });

    describe('Course API Tests', function () {

        describe('POST /courses - Course Creation', function () {
            it('should create a course with valid data', async function () {
                const response = await request(app)
                    .post('/courses')
                    .send({
                        name: 'API_TEST_COURSE_Physics',
                        subject: 'Physics',
                        year: 2,
                        teacher: 'Dr. Smith',
                        school: testSchool._id
                    })
                    .expect(201);

                assert.strictEqual(response.body.name, 'API_TEST_COURSE_Physics');
                assert.strictEqual(response.body.subject, 'Physics');
                assert.strictEqual(response.body.year, 2);
                assert.strictEqual(response.body.school, testSchool._id);
            });

            it('should reject invalid year (less than 1)', async function () {
                const response = await request(app)
                    .post('/courses')
                    .send({
                        name: 'API_TEST_COURSE_Invalid Year',
                        subject: 'Wiskunde',
                        year: 0,
                        teacher: 'Leeraar',
                        school: testSchool._id
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'Invalid year');
            });

            it('should reject invalid year (greater than 6)', async function () {
                const response = await request(app)
                    .post('/courses')
                    .send({
                        name: 'API_TEST_COURSE_Invalid Year 2',
                        subject: 'Wiskunde',
                        year: 7,
                        teacher: 'Leeraar',
                        school: testSchool._id
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'Invalid year');
            });

            it('should reject non-existent school', async function () {
                const response = await request(app)
                    .post('/courses')
                    .send({
                        name: 'API_TEST_COURSE_Bad School',
                        subject: 'Wiskunde',
                        year: 1,
                        teacher: 'Leeraar',
                        school: 'nonexistent-school-id'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'Parent school not found');
            });
        });

        describe('GET /courses', function () {
            it('should get all courses', async function () {
                const response = await request(app)
                    .get('/courses')
                    .expect(200);

                assert(Array.isArray(response.body));
                assert(response.body.length > 0);
            });

            it('should filter courses by year', async function () {
                const response = await request(app)
                    .get('/courses?year=1')
                    .expect(200);

                assert(Array.isArray(response.body));
                response.body.forEach(course => {
                    assert.strictEqual(course.year, 1);
                });
            });

            it('should reject invalid query parameters', async function () {
                const response = await request(app)
                    .get('/courses?invalid=param')
                    .expect(400);

                assert.strictEqual(response.body.message, 'Invalid query parameters. Only "year" is allowed.');
            });
        });

        describe('GET /courses/:uuid', function () {
            it('should get a specific course', async function () {
                const response = await request(app)
                    .get(`/courses/${testCourse._id}`)
                    .expect(200);

                assert.strictEqual(response.body._id, testCourse._id);
                assert.strictEqual(response.body.name, testCourse.name);
            });

            it('should return 404 for non-existent course', async function () {
                const response = await request(app)
                    .get('/courses/nonexistent-course-id')
                    .expect(404);

                assert.strictEqual(response.body.message, 'Course not found');
            });
        });

        describe('PUT /courses/:uuid', function () {
            it('should update a course', async function () {
                const response = await request(app)
                    .put(`/courses/${testCourse._id}`)
                    .send({
                        name: 'API_TEST_COURSE_Updated Wiskunde'
                    })
                    .expect(200);

                assert.strictEqual(response.body.name, 'API_TEST_COURSE_Updated Wiskunde');
                assert.strictEqual(response.body._id, testCourse._id);
            });

            it('should reject updating to invalid year', async function () {
                const response = await request(app)
                    .put(`/courses/${testCourse._id}`)
                    .send({
                        year: 10
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'Invalid year');
            });

            it('should reject updating to non-existent school', async function () {
                const response = await request(app)
                    .put(`/courses/${testCourse._id}`)
                    .send({
                        school: 'nonexistent-school-id'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'Parent school not found');
            });

            it('should reject changing course _id', async function () {
                const response = await request(app)
                    .put(`/courses/${testCourse._id}`)
                    .send({
                        _id: 'new-id-123'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'Cannot change course ID');
            });

            it('should return 404 for non-existent course', async function () {
                const response = await request(app)
                    .put('/courses/nonexistent-course-id')
                    .send({
                        name: 'Updated'
                    })
                    .expect(404);

                assert.strictEqual(response.body.message, 'Course not found');
            });
        });

        describe('DELETE /courses/:uuid', function () {
            it('should delete a course', async function () {
                const courseToDelete = await Course.create({
                    _id: 'api-test-course-delete',
                    name: 'API_TEST_COURSE_To Delete',
                    subject: 'Test',
                    year: 1,
                    teacher: 'Test Leeraar',
                    school: testSchool._id
                });

                const response = await request(app)
                    .delete(`/courses/${courseToDelete._id}`)
                    .expect(200);

                assert.strictEqual(response.body.message, 'Course deleted successfully');
                assert.strictEqual(response.body.course._id, courseToDelete._id);

                const deletedCourse = await Course.findById(courseToDelete._id);
                assert.strictEqual(deletedCourse, null);
            });

            it('should return 404 for non-existent course', async function () {
                const response = await request(app)
                    .delete('/courses/nonexistent-course-id')
                    .expect(404);

                assert.strictEqual(response.body.message, 'Course not found');
            });
        });
    });

});



