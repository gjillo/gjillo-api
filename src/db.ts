import postgres from 'postgres'
import * as process from "process";

const sql = postgres({
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
}) // will use psql environment variables

export default sql