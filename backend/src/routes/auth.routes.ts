import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, refreshTokenSchema } from "../validators/auth.validator";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

router.post("/register", validate(registerSchema), AuthController.register);
router.post("/login", validate(loginSchema), AuthController.login);
router.post("/refresh-token", validate(refreshTokenSchema), AuthController.refreshToken);
router.post("/logout", AuthController.logout);
router.get("/me", authenticateJWT, AuthController.getMe);

export default router;
