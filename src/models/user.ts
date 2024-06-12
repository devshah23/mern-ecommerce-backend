import mongoose from "mongoose";
import validator from "validator";
interface IUser extends mongoose.Document{
    _id: string;
    name: string;
    email: string;
    photo: string;
    role: "admin" | "user";
    gender:"male" | "female";
    dob: Date;
    createdAt: Date;
    updatedAt: Date;
    age: number;

}


const schema = new mongoose.Schema({
    _id:{
        type: String,
        required:[true, "User ID is required"]
    },
    name:{
        type: String,
        required:[true, "User name is required"]
    },
    email:{
        type: String,
        unique: [true, "Email already exists"],
        required:[true, "User email is required"],
        validate:validator.default.isEmail,
    },
    photo:{
        type: String,
        required:[true, "User photo is required"]
    },
    role:{
        type: String,
        enum: ["admin", "user"],
        default: "user"
    },
    gender:{
        type: String,
        enum:["male","female"],
        required:[true, "Please provide Gender"]
    },
    dob:{
        type: Date,
        required:[true, "Please provide Date of Birth"] 
    },
},{
    timestamps: true,
});
schema.virtual("age").get(function(){
    const today = new Date();
    const dob:Date = this.dob;
    let age = today.getFullYear() - dob.getFullYear();
    if(today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())){
        age--;
    }
    return age;

})
export const User = mongoose.model<IUser>("User", schema);