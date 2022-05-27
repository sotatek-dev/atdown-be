"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class UserDevicesSchema extends Schema {
  up() {
    this.create("user_devices", (table) => {
      table.increments();
      table.integer("user_id").unsigned().references("id").inTable("users");
      table.string("player_id");
      table.bool("login_status").notNullable().default(true);
      table.datetime("login_at");
      table.bool("subscribe_status");
      table.timestamps();
    });
  }

  down() {
    this.drop("user_devices");
  }
}

module.exports = UserDevicesSchema;
