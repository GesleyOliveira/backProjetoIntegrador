import mysql from 'mysql2'
import dotenv from 'dotenv';

dotenv.config({ path: 'config/credentials.env' });
const USER_APP = process.env.USER_APP;
const SENHA_APP = process.env.SENHA_APP;
const HOST = 'localhost'
const DATABASE = 'projetoIntegrador'


const pool = mysql.createPool({
  host: HOST, 
  user: USER_APP, 
  password: SENHA_APP, 
  database: DATABASE, 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

const promisePool = pool.promise()

export { promisePool }
