import { Request, Response } from 'express';

export async function registerUser(req:Request, res:Response) {
    try {
        const { name, email, password } = req.body;
    } catch (error) {
        console.log("Error in registerUser: ", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}