// source: https://medium.com/@ehtemam/writing-test-with-supertest-and-mocha-for-expressjs-routes-555d2910d2c2

const assert = require('assert');
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const School = require('../models/school');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { user, password, host, clusterName } = config.databaseCredentials;
const uri = `mongodb+srv://${user}:${password}@${host}/?appName=${clusterName}`;

describe('School Validation Tests', function () {
    // Increase timeout for database operations
    this.timeout(10000);

    before(async function () {
        await mongoose.connect(uri);
        // Clean up test data
        await School.deleteMany({ name: { $regex: /^TEST_/ } });
        await School.deleteMany({ name: { $regex: /^API_TEST_/ } });
        testUmbrella = await School.create({
            _id: 'api-test-umbrella',
            name: 'API_TEST_Umbrella',
            type: 'umbrella',
            email: 'api-umbrella@example.com',
            telephone: '1234567890'
        });

        testBoard = await School.create({
            _id: 'api-test-board',
            name: 'API_TEST_Board',
            type: 'board',
            belongsTo: testUmbrella._id,
            email: 'api-board@example.com',
            telephone: '1234567890'
        });

        testSchool = await School.create({
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
        await School.deleteMany({ name: { $regex: /^TEST_/ } });
        await School.deleteMany({ name: { $regex: /^API_TEST_/ } });
        await mongoose.connection.close();
    });

    describe('Model Tests', function () {
        describe('School Type Validation', function () {
            it('should reject invalid type', async function () {
                try {
                    await School.create({
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
                    await School.create({
                        _id: 'test-no-name',
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
                    await School.create({
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
                    await School.create({
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
                    await School.create({
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
                const school = await School.create({
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

    describe('API Tests', function () {
        describe('POST /schools - Hierarchy Validation', function () {
            it('should allow creating a school belonging to a board', async function () {
                const response = await request(app)
                    .post('/schools')
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
                    .post('/schools')
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
                    .post('/schools')
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
                    .post('/schools')
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
                    .post('/schools')
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
                    .post('/schools')
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
                    .post('/schools')
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
                    .post('/schools')
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

        describe('PUT /schools/:uuid - Hierarchy Validation', function () {
            it('should allow updating school to belong to a different board', async function () {
                const newBoard = await School.create({
                    _id: 'api-test-new-board',
                    name: 'API_TEST_New Board',
                    type: 'board',
                    belongsTo: testUmbrella._id,
                    email: 'api-new-board@example.com',
                    telephone: '1234567890'
                });

                const response = await request(app)
                    .put(`/schools/${testSchool._id}`)
                    .send({
                        belongsTo: newBoard._id
                    })
                    .expect(200);

                assert.strictEqual(response.body.belongsTo, newBoard._id);
            });

            it('should reject updating school to belong to an umbrella', async function () {
                const response = await request(app)
                    .put(`/schools/${testSchool._id}`)
                    .send({
                        belongsTo: testUmbrella._id
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'A school can only belong to a board');
            });

            it('should reject updating board to belong to a school', async function () {
                const response = await request(app)
                    .put(`/schools/${testBoard._id}`)
                    .send({
                        belongsTo: testSchool._id
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'A board can only belong to an umbrella');
            });

            it('should reject changing umbrella to have a parent', async function () {
                const response = await request(app)
                    .put(`/schools/${testUmbrella._id}`)
                    .send({
                        belongsTo: testUmbrella._id
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'An umbrella cannot belong to something else');
            });

            it('should reject updating belongsTo to non-existent parent', async function () {
                const response = await request(app)
                    .put(`/schools/${testSchool._id}`)
                    .send({
                        belongsTo: 'nonexistent-id-99999'
                    })
                    .expect(400);

                assert.strictEqual(response.body.message, 'Parent school not found');
            });
        });
    });

});

