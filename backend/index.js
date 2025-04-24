import express, { urlencoded } from 'express';
import cors from "cors";
import cookieParser from 'cookie-parser';
import userRoutes from "./src/routes/auth_routes.js"

const app = express()
const port = 3000

app.use(express.json());
app.use(urlencoded({extended:true}));
app.use(cookieParser());

app.use(cors({
    origin: 'localhost:3000',
    methods: ['GET' , 'POST' , 'PUT' , 'DELETE'],
    allowedHeaders: ['Content-Type' , 'Authorization']
}))
app.get('/', (req, res) => {
  res.send('RJ is here')
})



app.use("/api/v1/users" , userRoutes)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})