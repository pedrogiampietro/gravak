"use strict";

const CharacterCreator = requireModule("auth/character-creator");
const Enum = requireModule("utils/enum");
const { getDatabase, closeDatabase, schema } = require("../db");
const { accounts } = schema;
const { eq, and } = require("drizzle-orm");

const bcrypt = require("bcryptjs");

const AccountDatabase = function () {
  /*
   * Class AccountDatabase
   * Wrapper for the account database using PostgreSQL with Drizzle ORM
   *
   * API:
   *
   * AccountDatabase.saveCharacter(gameSocket, callback) - Saves the character to the database
   * AccountDatabase.createAccount(queryObject, callback) - Creates a new account and character with account, password, name, and sex
   *
   */

  this.characterCreator = new CharacterCreator();
  this.__status = this.STATUS.OPENING;

  // Initialize database connection
  this.__open();
};

AccountDatabase.prototype.STATUS = new Enum(
  "OPENING",
  "OPEN",
  "CLOSING",
  "CLOSED"
);

AccountDatabase.prototype.__open = async function () {
  /*
   * AccountDatabase.__open
   * Opens the PostgreSQL database connection
   */

  try {
    this.db = getDatabase();
    this.__status = this.STATUS.OPEN;
    console.log("The PostgreSQL database connection has been opened");

    // Create default character if configured
    if (CONFIG.DATABASE.DEFAULT_CHARACTER.ENABLED) {
      await this.__createDefaultCharacter(CONFIG.DATABASE.DEFAULT_CHARACTER);
    }
  } catch (error) {
    console.error("Error opening the database: %s".format(error.message));
  }
};

AccountDatabase.prototype.__createDefaultCharacter = async function (
  DEFAULT_CHARACTER
) {
  /*
   * Function AccountDatabase.__createDefaultCharacter
   * Creates and writes the configured default character to the database if it doesn't exist
   */

  const queryObject = {
    account: DEFAULT_CHARACTER.ACCOUNT,
    password: DEFAULT_CHARACTER.PASSWORD,
    name: DEFAULT_CHARACTER.NAME,
    sex: DEFAULT_CHARACTER.SEX,
  };

  // Check if default character already exists
  const existing = await this.db
    .select()
    .from(accounts)
    .where(eq(accounts.account, queryObject.account.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    console.log("Default character already exists, skipping creation");
    return;
  }

  this.createAccount(queryObject, function (error) {
    if (error !== null) {
      return console.error(
        "Error creating default character: %s".format(error)
      );
    }

    console.log(
      "Default character %s has been created".format(queryObject.name)
    );
  });
};

AccountDatabase.prototype.close = async function () {
  /*
   * Function AccountDatabase.close
   * Closes the PostgreSQL database connection
   */

  this.__status = this.STATUS.CLOSING;

  // We do NOT close the global database connection here because it is a singleton shared
  // between LoginServer and WebsocketServer. Closing it here would kill the pool for everyone.
  // The database connection should be closed only when the application process terminates.

  /*
  try {
    await closeDatabase();
    this.__status = this.STATUS.CLOSED;
    console.log("The database connection has been closed.");
  } catch (error) {
    console.error("Error closing database: %s".format(error.message));
  }
  */
  this.__status = this.STATUS.CLOSED;
};

AccountDatabase.prototype.createAccount = function (queryObject, callback) {
  /*
   * Function AccountDatabase.createAccount
   * Creates a new account with hashed password
   */

  const SALT_ROUNDS = 12;

  // Preliminary check if account already exists
  this.getAccountCredentials(
    queryObject.account,
    function (error, result) {
      if (error !== null) {
        return callback(500, null);
      }

      // Already exists
      if (result !== undefined) {
        return callback(409, null);
      }

      // Slow hashing algorithm
      bcrypt.hash(
        queryObject.password,
        SALT_ROUNDS,
        async function (error, hash) {
          // Server error if something is wrong with bcrypt
          if (error) {
            return callback(500, null);
          }

          try {
            // Creates a new character from a blueprint
            const account = queryObject.account.toLowerCase();
            const name = queryObject.name.capitalize();
            const character = this.characterCreator.create(name, queryObject.sex);

            // Insert into the database
            await this.db.insert(accounts).values({
              account: account,
              hash: hash,
              name: name,
              character: JSON.stringify(character),
            });

            callback(null, null);
          } catch (insertError) {
            // Handle unique constraint violation
            if (insertError.code === "23505") {
              return callback(409, null);
            }
            console.error("Error inserting account:", insertError);
            callback(500, null);
          }
        }.bind(this)
      );
    }.bind(this)
  );
};

AccountDatabase.prototype.saveCharacter = async function (gameSocket, callback) {
  /*
   * Function AccountDatabase.saveCharacter
   * Saves the character data to the database
   */

  try {
    const character = JSON.stringify(gameSocket.player);

    await this.db
      .update(accounts)
      .set({
        character: character,
        updatedAt: new Date(),
      })
      .where(eq(accounts.account, gameSocket.account));

    callback(null);
  } catch (error) {
    console.error("Error saving character:", error);
    callback(error);
  }
};

AccountDatabase.prototype.getCharacter = async function (account, callback) {
  /*
   * Function AccountDatabase.getCharacter
   * Returns the character for a specific account
   */

  try {
    const result = await this.db
      .select({ character: accounts.character })
      .from(accounts)
      .where(eq(accounts.account, account))
      .limit(1);

    if (result.length === 0) {
      return callback(null, undefined);
    }

    callback(null, result[0]);
  } catch (error) {
    console.error("Error getting character:", error);
    callback(error, null);
  }
};

AccountDatabase.prototype.getAccountCredentials = async function (account, callback) {
  /*
   * Function AccountDatabase.getAccountCredentials
   * Returns the account credentials for a given account to verify the password
   */

  try {
    const result = await this.db
      .select({ hash: accounts.hash })
      .from(accounts)
      .where(eq(accounts.account, account.toLowerCase()))
      .limit(1);

    if (result.length === 0) {
      return callback(null, undefined);
    }

    callback(null, result[0]);
  } catch (error) {
    console.error("Error getting account credentials:", error);
    callback(error, null);
  }
};

module.exports = AccountDatabase;
