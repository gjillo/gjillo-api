import postgres from 'postgres';
import process from 'process';

const SQL = postgres({
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: "require",
}) // will use psql environment variables

export { SQL }