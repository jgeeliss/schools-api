const mongoose = require('mongoose');
const School = require('../models/school');
const Uuid = require('uuid');
const { run } = require('./db');


const umbrellas = [
    {
        name: 'Gemeenschapsonderwijs',
        email: 'info@gemeenschapsonderwijs.be',
        telephone: '020-1234567',
        type: 'umbrella',
        belongsTo: null
    },
    {
        name: 'Katholiek Onderwijs Vlaanderen',
        email: 'contact@katholiekonderwijs.vlaanderen',
        telephone: '030-2345678',
        type: 'umbrella',
        belongsTo: null
    },
];

const boards = [
    {
        name: 'Schoolbestuur Mechelen Brussel',
        email: 'bestuur@mechelen-brussel.be',
        telephone: '020-4567890',
        type: 'board'
    },
    {
        name: 'Schoolbestuur Antwerpen Centrum',
        email: 'info@antwerpen-centrum.be',
        telephone: '010-5678901',
        type: 'board'
    },
    {
        name: 'Schoolbestuur Oost Vlaanderen',
        email: 'contact@oost-vlaanderen.be',
        telephone: '030-6789012',
        type: 'board'
    },
    {
        name: 'Schoolbestuur Limburg',
        email: 'info@limburg.be',
        telephone: '070-7890123',
        type: 'board'
    },
    {
        name: 'Schoolbestuur Leuven',
        email: 'bestuur@leuven.be',
        telephone: '040-8901234',
        type: 'board'
    }
];

const schools = [
    {
        name: 'Sint-Jozefschool Mechelen',
        email: 'jozef@mechelen.be',
        telephone: '015-1234567',
        type: 'school',
    },
    {
        name: 'Basisschool De Horizon',
        email: 'horizon@school.be',
        telephone: '016-2345678',
        type: 'school',
    },
    {
        name: 'Secundaire School Het Kompas',
        email: 'kompas@school.be',
        telephone: '017-3456789',
        type: 'school',
    },
    {
        name: 'Basisschool Sint-Maria',
        email: 'sint-maria@school.be',
        telephone: '018-4567890',
        type: 'school',
    },
    {
        name: 'Secundaire School De Ster',
        email: 'de-ster@school.be',
        telephone: '019-5678901',
        type: 'school',
    },
    {
        name: 'Basisschool De Regenboog',
        email: 'regenboog@school.be',
        telephone: '020-6789012',
        type: 'school',
    },
    {
        name: 'Secundaire School Het Anker',
        email: 'anker@school.be',
        telephone: '021-7890123',
        type: 'school',
    },
    {
        name: 'Basisschool De Vlinder',
        email: 'vlinder@school.be',
        telephone: '022-8901234',
        type: 'school',
    }
];

const courses = [
    {
        name: 'Wiskunde 101',
        subject: 'Wiskunde',
        teacher: 'Jan Jansen',
        school: 'school-uuid-1',
        year: 1
    },
    {
        name: 'Geschiedenis van België',
        subject: 'Geschiedenis',
        teacher: 'Marie De Vries',
        year: 1
    },
    {
        name: 'Inleiding tot de Informatica',
        subject: 'Informatica',
        teacher: 'Pieter Peeters',
        year: 4
    },
    { 
        name: 'Natuurkunde Basis',
        subject: 'Natuurkunde',
        teacher: 'Sofie Claes',
        year: 2
    },
    { 
        name: 'Chemie voor Beginners',
        subject: 'Chemie',
        teacher: 'Tom Van Damme',
        year: 3
    },
    {
        name: 'Biologie en Milieu',
        subject: 'Biologie',
        teacher: 'Eva Maes',
        year: 6
    }
];

async function seed() {
    try {
        await run();

        // Clear existing data
        await School.deleteMany({});
        console.log('Cleared existing schools data');

        // Create umbrellas first
        const createdUmbrellas = [];
        for (const umbrella of umbrellas) {
            umbrella._id = Uuid.v4();
            const created = await School.create(umbrella);
            createdUmbrellas.push(created);
            console.log(`Created umbrella: ${created.name}`);
        }

        // Assign each board to a random umbrella
        for (const board of boards) {
            board._id = Uuid.v4();
            const randomUmbrella = createdUmbrellas[Math.floor(Math.random() * createdUmbrellas.length)];
            board.belongsTo = randomUmbrella._id;
            const created = await School.create(board);
            console.log(`Created board: ${created.name}${created.belongsTo ? ' (with umbrella)' : ''}`);
        }

        // Assign each school to a random board
        for (const school of schools) {
            school._id = Uuid.v4();
            const randomBoard = boards[Math.floor(Math.random() * boards.length)];
            school.belongsTo = randomBoard._id;
            const created = await School.create(school);
            console.log(`Created school: ${created.name}${created.belongsTo ? ' (with board)' : ''}`);
        }

        // assign each course to a random school
        for (const course of courses) {
            course._id = Uuid.v4();
            const randomSchool = schools[Math.floor(Math.random() * schools.length)];
            course.school = randomSchool._id;
            const Course = require('../models/course');
            const createdCourse = await Course.create(course);
            console.log(`Created course: ${createdCourse.name} (for school: ${randomSchool.name})`);
        }

        console.log('\n=== Seeding Complete ===');

        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seeder
seed();  
