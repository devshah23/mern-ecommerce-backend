import { NextFunction,Request,Response } from "express";
import { NewUserRequestBody } from "../types/types.js";
import { User } from "../models/user.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";

export const newUser = TryCatch(async (req: Request<{},{},NewUserRequestBody>, res: Response,next:NextFunction) => {
        const {name,photo,email,gender,_id,dob}=req.body;
        let user=await User.findById(_id);
        if(user) return res.status(200).json({
            success:true,
            message:`Welcome back, ${user.name}`
        });

        if(!_id || !name || !email || !photo || !gender || !dob) return next(new ErrorHandler("Please fill all the fields",400));


        user=await User.create({
            name,
            photo,
            email,
            gender,
            _id,
            dob: new Date(dob),
        });


        return res.status(201).json({
            success: true,
            message: `Welcome, ${user.name}`,
    });


});


export const getAllUsers=TryCatch(async (req: Request, res: Response,next:NextFunction) => {
    const users=await User.find();
    return res.status(200).json({
        success:true,
        users
    });
});


export const getUser=TryCatch(async (req: Request, res: Response,next:NextFunction) => {
   const id=req.params.id;
   const user=await User.findById(id);
   if(!user) return next(new ErrorHandler("User not found",400));
    return res.status(200).json({
        success:true,
        user
    });
});





export const deleteUser=TryCatch(async (req: Request, res: Response,next:NextFunction) => {
    const id=req.params.id;
    const user=await User.findByIdAndDelete(id);
    if(!user) return next(new ErrorHandler("User not found",400));
    return res.status(200).json({
        success:true,
        message:"User deleted successfully"
    });
});


