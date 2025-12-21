"use strict";

const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const schema = require("./schema");

// Load environment variables
require("dotenv").config();

let db = null;
let pool = null;

/**
 * Initialize the database connection
 * @returns {Object} Drizzle database instance
 */
function initDatabase() {
    if (db) {
        return db;
    }

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error(
            "DATABASE_URL environment variable is not set. " +
            "Please create a .env file with DATABASE_URL=postgresql://user:password@localhost:5432/t_engine"
        );
    }

    pool = new Pool({
        connectionString,
        max: 10, // Maximum number of connections in the pool
    });

    db = drizzle(pool, { schema });

    console.log("PostgreSQL database connection initialized");

    return db;
}

/**
 * Get the database instance (initializes if not already done)
 * @returns {Object} Drizzle database instance
 */
function getDatabase() {
    if (!db) {
        return initDatabase();
    }
    return db;
}

/**
 * Close the database connection
 */
async function closeDatabase() {
    if (pool) {
        await pool.end();
        pool = null;
        db = null;
        console.log("PostgreSQL database connection closed");
    }
}

module.exports = {
    initDatabase,
    getDatabase,
    closeDatabase,
    schema,
};
