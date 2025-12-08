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
            board.belongsTo = randomUmbrella.permalink;
            const created = await School.create(board);
            console.log(`Created board: ${created.name}${created.belongsTo ? ' (with umbrella)' : ''}`);
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
