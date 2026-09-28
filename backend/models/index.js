"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const sequelize = require("../config/database");

const db = {};

fs.readdirSync(__dirname)
  .filter((f) => f !== "index.js" && f.endsWith(".js"))
  .forEach((file) => {
    try {
      const modelDef = require(path.join(__dirname, file));

      // Skip files that don't export a function
      if (typeof modelDef !== "function") {
        console.warn(`⚠️  Skipping ${file} — not a model function`);
        return;
      }

      const model = modelDef(sequelize, Sequelize.DataTypes);

      // Skip if the model didn't define a proper name
      if (!model || !model.name) {
        console.warn(`⚠️  Skipping ${file} — model.name is undefined`);
        return;
      }

      db[model.name] = model;
      console.log(`✅ Loaded model: ${model.name} (from ${file})`);
    } catch (err) {
      console.error(`❌ Failed to load ${file}:`, err.message);
    }
  });

Object.keys(db).forEach((name) => {
  if (db[name].associate) {
    try {
      db[name].associate(db);
    } catch (err) {
      console.error(`❌ associate() failed for ${name}:`, err.message);
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log("📦 Loaded models:", Object.keys(db));
module.exports = db;