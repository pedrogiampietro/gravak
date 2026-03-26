"use strict";

const { pgTable, serial, varchar, text, timestamp, uniqueIndex, index } = require("drizzle-orm/pg-core");

/**
 * Schema definition for the accounts table
 * Stores user accounts and their character data
 */
const accounts = pgTable(
    "accounts",
    {
        id: serial("id").primaryKey(),
        account: varchar("account", { length: 64 }).notNull(),
        hash: varchar("hash", { length: 60 }),                        // nullable — wallet accounts have no password
        walletAddress: varchar("wallet_address", { length: 64 }),     // Solana public key (base58, 44 chars)
        name: varchar("name", { length: 32 }).notNull(),
        character: text("character").notNull(), // JSON stored as text
        createdAt: timestamp("created_at").defaultNow(),
        updatedAt: timestamp("updated_at").defaultNow(),
    },
    (table) => ({
        accountNameUnique: uniqueIndex("account_name_unique").on(table.account, table.name),
        walletAddressIdx: index("wallet_address_idx").on(table.walletAddress),
    })
);

module.exports = { accounts };
