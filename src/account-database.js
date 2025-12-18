"use strict";

const CharacterCreator = requireModule("character-creator");
const Enum = requireModule("enum");

const bcrypt = require("bcryptjs");
const fs = require("fs");
const sqlite3 = require("sqlite3");

const AccountDatabase = function (filepath) {
  /*
   * Class AccountDatabase
   * Wrapper for the account database
   *
   * API:
   *
   * AccountDatabase.saveCharacter(gameSocket, callback) - Saves the character to the database
   * AccountDatabase.createAccount(queryObject, callback) - Creates a new account and character with account, password, name, and sex
   *
   */

  // Path of the sqlite account database
  this.filepath = filepath;
  this.characterCreator = new CharacterCreator();
  this.__status = this.STATUS.OPENING;

  // Open the database
  this.__open(this.__handleOpen.bind(this));
};

AccountDatabase.prototype.STATUS = new Enum(
  "OPENING",
  "OPEN",
  "CLOSING",
  "CLOSED"
);

AccountDatabase.prototype.__handleOpen = function (error) {
  if (error) {
    return console.error("Error opening the database %s".format(this.filepath));
  }

  this.__status = this.STATUS.OPEN;
  console.log(
    "The sqlite database connection to %s has been opened".format(this.filepath)
  );
};

AccountDatabase.prototype.__open = function (callback) {
  /*
   * AccountDatabase.__open
   * Opens the sqlite3 database from file
   */

  // The database file already exists
  if (fs.existsSync(this.filepath)) {
    return (this.db = new sqlite3.Database(
      this.filepath,
      sqlite3.OPEN_READWRITE,
      callback
    ));
  }

  // Create a new database
  return this.__createNewDatabase(callback);
};

AccountDatabase.prototype.__createNewDatabase = function (callback) {
  /*
   * Function AccountDatabase.__createNewDatabase
   * Creates a brand new Sqlite3 database and inserts an optional default character
   */

  // Create a new database
  this.db = new sqlite3.Database(
    this.filepath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    callback
  );

  // Serialize the control flow
  this.db.serialize(
    function () {
      // Table that holds the accounts
      this.__createAccountDatabase();

      // Create a default character
      if (CONFIG.DATABASE.DEFAULT_CHARACTER.ENABLED) {
        this.__createDefaultCharacter(CONFIG.DATABASE.DEFAULT_CHARACTER);
      }
    }.bind(this)
  );
};

AccountDatabase.prototype.__createDefaultCharacter = function (
  DEFAULT_CHARACTER
) {
  /*
   * Function AccountDatabase.__createDefaultCharacter
   * Creates and writes the configured default character to the database
   */

  let queryObject = new Object({
    account: DEFAULT_CHARACTER.ACCOUNT,
    password: DEFAULT_CHARACTER.PASSWORD,
    name: DEFAULT_CHARACTER.NAME,
    sex: DEFAULT_CHARACTER.SEX,
  });

  // Add a default account
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

AccountDatabase.prototype.__createAccountDatabase = function () {
  /*
   * AccountDatabase.__createAccountDatabase
   * Inserts the table schema
   */

  let tableQuery = `
    CREATE TABLE
    IF NOT EXISTS
    accounts(
      'id' INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      'account' VARCHAR(32) NOT NULL,
      'hash' BINARY(60) NOT NULL,
      'name' VARCHAR(32) NOT NULL,
      'character' JSON NOT NULL,
      UNIQUE(account, name)
    );`;

  // Run the table creation query
  this.db.run(tableQuery, function (error) {
    if (error !== null) {
      return console.error("Error creating account table");
    }

    console.log("Created account table");
  });
};

AccountDatabase.prototype.close = function () {
  /*
   * Function AccountDatabase.close
   * Closes the sqlite3 database
   */

  this.__status = this.STATUS.CLOSING;
  this.db.close(this.__handleClose.bind(this));
};

AccountDatabase.prototype.__handleClose = function (error) {
  if (error) {
    return console.error(error.message);
  }

  this.__status = this.STATUS.CLOSED;
  console.log("The database connection has been closed.");
};

AccountDatabase.prototype.createAccount = function (queryObject, callback) {
  /*
   * Function AccountDatabase.createAccount
   * Closes the sqlite3 database
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
        function (error, hash) {
          // Server error if something is wrong with bcrypt
          if (error) {
            return callback(500, null);
          }

          // Creates a new character from a blueprint
          let account = queryObject.account.toLowerCase();
          let name = queryObject.name.capitalize();
          let character = this.characterCreator.create(name, queryObject.sex);
          let values = new Array(account, hash, name, character);

          // Insert in to the database (may conflict)
          this.db.run(
            "INSERT INTO accounts(account, hash, name, character) VALUES(?, ?, ?, ?)",
            values,
            callback
          );
        }.bind(this)
      );
    }.bind(this)
  );
};

AccountDatabase.prototype.saveCharacter = function (gameSocket, callback) {
  /*
   * Function AccountDatabase.saveCharacter
   * Returns the character for a specific account
   */

  // Serialize the player character
  let character = JSON.stringify(gameSocket.player);

  this.db.run(
    "UPDATE accounts SET character = ? WHERE account = ?",
    [character, gameSocket.account],
    callback
  );
};

AccountDatabase.prototype.getCharacter = function (account, callback) {
  /*
   * Function AccountDatabase.getCharacter
   * Returns the character for a specific account
   */

  this.db.get(
    "SELECT character FROM accounts WHERE account = ?",
    [account],
    callback
  );
};

AccountDatabase.prototype.getAccountCredentials = function (account, callback) {
  /*
   * Function AccountDatabase.getAccountCredentials
   * Returns the account credentials for a given account to verify the password
   */

  this.db.get(
    "SELECT hash FROM accounts WHERE account = ?",
    [account],
    callback
  );
};

AccountDatabase.prototype.loadCharacter = function (name) {
  // Este método provavelmente não existe, precisamos ver como o projeto carrega os dados
};

module.exports = AccountDatabase;
