
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const attributes = [
    // TECH
    { category: 'Tech', name: 'resolution', label: 'Resolution', type: 'text', placeholder: 'e.g. 4K, 24MP', order: 1 },
    { category: 'Tech', name: 'storage', label: 'Storage Capacity', type: 'text', placeholder: 'e.g. 512GB, 1TB', order: 2 },
    { category: 'Tech', name: 'connectivity', label: 'Connectivity', type: 'text', placeholder: 'e.g. WiFi, Bluetooth, HDMI', order: 3 },

    // VEHICLES
    { category: 'Vehicles', name: 'fuel_type', label: 'Fuel Type', type: 'select', options: ['Gasoline', 'Diesel', 'Electric', 'Hybrid'], order: 1 },
    { category: 'Vehicles', name: 'transmission', label: 'Transmission', type: 'select', options: ['Automatic', 'Manual'], order: 2 },
    { category: 'Vehicles', name: 'seats', label: 'Seat Count', type: 'number', placeholder: 'e.g. 5', order: 3 },

    // EQUIPMENT
    { category: 'Equipment', name: 'power_source', label: 'Power Source', type: 'select', options: ['Battery', 'Corded', 'Gas', 'Manual'], order: 1 },
    { category: 'Equipment', name: 'professional_grade', label: 'Professional Grade', type: 'boolean', order: 2 },
    { category: 'Equipment', name: 'weight', label: 'Weight (kg)', type: 'number', order: 3 },

    // STUDIOS
    { category: 'Studios', name: 'size_sqft', label: 'Size (sq.ft)', type: 'number', order: 1 },
    { category: 'Studios', name: 'soundproof', label: 'Soundproofed', type: 'boolean', order: 2 },
    { category: 'Studios', name: 'natural_light', label: 'Natural Light', type: 'boolean', order: 3 },
];

async function seed() {
    console.log('--- Seeding Category Attributes ---');

    for (const attr of attributes) {
        await prisma.categoryAttribute.upsert({
            where: {
                category_name: {
                    category: attr.category,
                    name: attr.name
                }
            },
            update: attr,
            create: attr
        });
        console.log(`Upserted: ${attr.category} > ${attr.name}`);
    }

    console.log('--- Seeding Complete ---');
    await prisma.$disconnect();
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
