// source: https://medium.com/@ehtemam/writing-test-with-supertest-and-mocha-for-expressjs-routes-555d2910d2c2

const assert = require('assert');
const mongoose = require('mongoose');
const School = require('../models/school');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { user, password, host, clusterName } = config.databaseCredentials;
const uri = `mongodb+srv://${user}:${password}@${host}/?appName=${clusterName}`;

describe('School Validation Tests', function() {
  // Increase timeout for database operations
  this.timeout(10000);

  before(async function() {
    await mongoose.connect(uri);
    // Clean up test data
    await School.deleteMany({ name: { $regex: /^TEST_/ } });
  });

  after(async function() {
    // Clean up test data
    await School.deleteMany({ name: { $regex: /^TEST_/ } });
    await mongoose.connection.close();
  });

  describe('School Type Validation', function() {
    it('should reject invalid type', async function() {
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

  describe('Required Fields Validation', function() {
    it('should require name', async function() {
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

    it('should require email', async function() {
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

    it('should require telephone', async function() {
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

    it('should require type', async function() {
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

  describe('Email Lowercase Validation', function() {
    it('should convert email to lowercase', async function() {
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

