import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import mongoose from 'mongoose';
import { User } from '../models/userSchema.js';

// Seed doctor data - adjust or extend this list as needed
const doctors = [
  // Pediatrics
  {
    firstName: "Riya",
    lastName: "Sharma",
    email: "riya.sharma@vitalcare.com",
    phone: "9876543211",
    dob: "1989-05-14",
    gender: "Female",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Pediatrics",
  },
  {
    firstName: "Ankit",
    lastName: "Verma",
    email: "ankit.verma@vitalcare.com",
    phone: "9876543212",
    dob: "1986-02-21",
    gender: "Male",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Pediatrics",
  },
  // Orthopedics
  {
    firstName: "Rahul",
    lastName: "Singh",
    email: "rahul.singh@vitalcare.com",
    phone: "9876543213",
    dob: "1985-08-10",
    gender: "Male",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Orthopedics",
  },
  {
    firstName: "Sneha",
    lastName: "Kapoor",
    email: "sneha.kapoor@vitalcare.com",
    phone: "9876543214",
    dob: "1990-11-02",
    gender: "Female",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Orthopedics",
  },
  // Cardiology
  {
    firstName: "Arjun",
    lastName: "Mehta",
    email: "arjun.mehta@vitalcare.com",
    phone: "9876543215",
    dob: "1984-01-19",
    gender: "Male",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Cardiology",
  },
  {
    firstName: "Neha",
    lastName: "Agarwal",
    email: "neha.agarwal@vitalcare.com",
    phone: "9876543216",
    dob: "1988-07-22",
    gender: "Female",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Cardiology",
  },
  // Neurology
  {
    firstName: "Kunal",
    lastName: "Bansal",
    email: "kunal.bansal@vitalcare.com",
    phone: "9876543217",
    dob: "1987-04-11",
    gender: "Male",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Neurology",
  },
  {
    firstName: "Priya",
    lastName: "Iyer",
    email: "priya.iyer@vitalcare.com",
    phone: "9876543218",
    dob: "1991-03-05",
    gender: "Female",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Neurology",
  },
  // Oncology
  {
    firstName: "Vikas",
    lastName: "Chauhan",
    email: "vikas.chauhan@vitalcare.com",
    phone: "9876543219",
    dob: "1983-09-13",
    gender: "Male",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Oncology",
  },
  {
    firstName: "Pooja",
    lastName: "Nair",
    email: "pooja.nair@vitalcare.com",
    phone: "9876543220",
    dob: "1989-12-08",
    gender: "Female",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Oncology",
  },
  // Radiology
  {
    firstName: "Rohit",
    lastName: "Malhotra",
    email: "rohit.malhotra@vitalcare.com",
    phone: "9876543221",
    dob: "1986-06-27",
    gender: "Male",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Radiology",
  },
  {
    firstName: "Shreya",
    lastName: "Kulkarni",
    email: "shreya.kulkarni@vitalcare.com",
    phone: "9876543222",
    dob: "1992-10-15",
    gender: "Female",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Radiology",
  },
  // Physical Therapy
  {
    firstName: "Amit",
    lastName: "Joshi",
    email: "amit.joshi@vitalcare.com",
    phone: "9876543223",
    dob: "1988-03-30",
    gender: "Male",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Physical Therapy",
  },
  {
    firstName: "Divya",
    lastName: "Patel",
    email: "divya.patel@vitalcare.com",
    phone: "9876543224",
    dob: "1991-09-07",
    gender: "Female",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Physical Therapy",
  },
  // Dermatology
  {
    firstName: "Manish",
    lastName: "Gupta",
    email: "manish.gupta@vitalcare.com",
    phone: "9876543225",
    dob: "1987-11-25",
    gender: "Male",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Dermatology",
  },
  {
    firstName: "Ananya",
    lastName: "Reddy",
    email: "ananya.reddy@vitalcare.com",
    phone: "9876543226",
    dob: "1990-04-18",
    gender: "Female",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "Dermatology",
  },
  // ENT
  {
    firstName: "Sandeep",
    lastName: "Yadav",
    email: "sandeep.yadav@vitalcare.com",
    phone: "9876543227",
    dob: "1985-02-14",
    gender: "Male",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "ENT",
  },
  {
    firstName: "Kavya",
    lastName: "Menon",
    email: "kavya.menon@vitalcare.com",
    phone: "9876543228",
    dob: "1993-07-29",
    gender: "Female",
    password: "doctor123",
    role: "Doctor",
    doctorDepartment: "ENT",
  },
];

const seed = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI not set in config.env. Aborting.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || 'MERN_STACK_HOSPITAL_MANAGEMENT_SYSTEM',
    });
    console.log('Connected to DB for seeding');

    // remove unwanted cardiology doctors if they exist
    const removeEmails = [
      'riya.verma@vitalcare.com',
      'arjun.mehta@vitalcare.com',
      'neha.agarwal@vitalcare.com',
    ];
    await User.deleteMany({ email: { $in: removeEmails } });
    console.log('Deleted unwanted doctors (if present)');

    for (const d of doctors) {
      const exists = await User.findOne({ email: d.email });
      if (exists) {
        console.log(`Doctor exists, skipping: ${d.email}`);
        continue;
      }
      await User.create(d);
      console.log(`Inserted doctor: ${d.firstName} ${d.lastName}`);
    }

    console.log('Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
