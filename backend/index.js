import express, { urlencoded } from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import userRoutes from "./src/routes/auth_routes.js"
import CfRoutes from './src/routes/cf_routes.js';

const app = express()
const port = 5000

app.use(express.json());
app.use(urlencoded({extended:true}));
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('RJ is here')
})



app.use("/api/v1/users" , userRoutes)
app.use("/api/v1/home" , CfRoutes)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})