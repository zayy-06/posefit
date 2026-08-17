const express = require("express");

const authMiddleware = require("../../middleware/authMiddleware");
const adminMiddleware = require("../../middleware/adminMiddleware");

const {
  getPendingProfessionals,
  updateProfessionalStatus,
} = require("../../controllers/admin/profReqController");

const getAllUsers = require("../../controllers/admin/allUsersController");
const userDetails = require("../../controllers/admin/userDetailsController");
const deleteUser = require("../../controllers/admin/deleteUserController");
const updateUser = require("../../controllers/admin/updateUserController");
const stats = require("../../controllers/admin/statsController");
const { getProfessionals } = require("../../controllers/admin/getProfessionalsController");
const addProfessional = require("../../controllers/admin/addProfessionalController");
const deleteProfessional = require("../../controllers/admin/deleteProfessionalController");
const analytics = require("../../controllers/admin/analyticsController");
const addUser = require("../../controllers/admin/addUserController");
const changeAdminPassword = require("../../controllers/admin/changePasswordController");

const router = express.Router();

router.get("/get-all-users", authMiddleware, adminMiddleware, getAllUsers);
router.get("/user-details", authMiddleware, adminMiddleware, userDetails);
router.delete("/delete-user/:id", authMiddleware, adminMiddleware, deleteUser);
router.put("/update-user/:id", authMiddleware, adminMiddleware, updateUser);
router.get("/stats", authMiddleware, adminMiddleware, stats);
router.get("/get-professionals", authMiddleware, adminMiddleware, getProfessionals);
router.post("/add-professional", authMiddleware, adminMiddleware, addProfessional);
router.delete("/delete-professional/:id", authMiddleware, adminMiddleware, deleteProfessional);
router.get("/analytics", authMiddleware, adminMiddleware, analytics);
router.post("/add-user", authMiddleware, adminMiddleware, addUser);
router.get("/professional-requests", authMiddleware, adminMiddleware, getPendingProfessionals);
router.put("/professional-status/:id", authMiddleware, adminMiddleware, updateProfessionalStatus);
router.put("/change-password", authMiddleware, adminMiddleware, changeAdminPassword);

module.exports = router;