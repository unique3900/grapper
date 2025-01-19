import express, { Router } from 'express';
import userRouter from './user/index';
import authRouter from './auth/index';
const router:Router=express.Router();

router.use('/user',userRouter)
router.use('/auth',authRouter)

export default router