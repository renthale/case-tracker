require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sslOptions = process.env.DB_SSL === 'false'
  ? undefined
  : { require: true, rejectUnauthorized: false };

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: sslOptions ? { ssl: sslOptions } : {},
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,
        dialectOptions: sslOptions ? { ssl: sslOptions } : {},
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

module.exports = sequelize;
