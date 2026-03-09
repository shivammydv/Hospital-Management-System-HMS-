import mongoose from "mongoose";
import { User } from "./models/userSchema.js";

const url = "mongodb+srv://shivamyadav894886:8qFBTZ1OHTpKRMjL@cluster0.qegclgi.mongodb.net/MERN_STACK_HOSPITAL_MANAGEMENT_SYSTEM"

mongoose.connect(url)

const user = await User.create({
    firstName: "Shivam",
    lastName: "Yadav",
    email: "shivamyadav@gmail.com",
    phone: "12345678901",
    dob: "06-22-2002",
    gender: "Male",
    password: "shivamyadav",
    role: "Admin",
});

console.log(user);
