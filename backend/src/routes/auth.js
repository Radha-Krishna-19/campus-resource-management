const express = require("express");
const { registerUser,
        loginUser,
        logoutUser,
        getMe,
        getPendingAdmins,
        approveAdmin,
        rejectAdmin,
        disableAdmin,
        removeAdmin,
        getCoordinators,
        deleteCoordinator,
        getActiveAdmins,
        getStats
} = require("../controllers/authController");

const requireAuth = require("../middlewares/requireAuth");
const requireRole = require("../middlewares/requireRole");
const validate = require("../middlewares/validate");
const { loginSchema, registerSchema } = require("../schemas");
const router = express.Router();

router.post("/login", validate(loginSchema), loginUser);
// Public admin request (NO auth required) — rate-limited in server.js
router.post("/admin/request", validate(registerSchema), registerUser);
router.post("/register", requireAuth, requireRole("admin"), validate(registerSchema), registerUser);
router.post("/logout", requireAuth, logoutUser);
router.get("/me", requireAuth, getMe);
router.get("/coordinators", requireAuth, requireRole("admin"), getCoordinators);
router.delete("/coordinator/:id", requireAuth, requireRole("admin"), deleteCoordinator);
router.get("/admin/active", requireAuth, requireRole("admin"), getActiveAdmins);
router.get("/admin/pending", requireAuth, requireRole("admin"), getPendingAdmins);
router.patch("/admin/:id/approve", requireAuth, requireRole("admin"), approveAdmin);
router.delete("/admin/:id/reject", requireAuth, requireRole("admin"), rejectAdmin);
router.patch("/admin/:id/disable", requireAuth, requireRole("admin"), disableAdmin);
router.delete("/admin/:id/remove", requireAuth, requireRole("admin"), removeAdmin);
router.get("/stats", requireAuth, getStats);

module.exports = router;

