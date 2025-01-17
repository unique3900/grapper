require("dotenv").config();
import express from 'express';

const server=express();
server.use(express.json());



server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

