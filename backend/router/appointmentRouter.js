import express from "express";
import {
  deleteAppointment,
  getAllAppointments,
  postAppointment,
  updateAppointmentStatus,
  updateAppointmentDetails,
  getBookedSlots,
  checkAvailability,
  getUserHistory,
} from "../controller/appointmentController.js";
import {
  isAdminAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

router.post("/post", isPatientAuthenticated, postAppointment);
router.get("/getall", isAdminAuthenticated, getAllAppointments);
router.get("/slots/:date", getBookedSlots);
// availability check used by chat assistant (no auth required)
router.get("/availability", checkAvailability);
// history for authenticated patient
router.get("/history", isPatientAuthenticated, getUserHistory);
router.put("/update/:id", isAdminAuthenticated, updateAppointmentStatus);
router.put("/update-details/:id", isPatientAuthenticated, updateAppointmentDetails);
router.delete("/delete/:id", isAdminAuthenticated, deleteAppointment);

export default router;
