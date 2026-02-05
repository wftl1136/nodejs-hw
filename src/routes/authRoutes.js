import express from 'express';
import { celebrate, Joi } from 'celebrate';

import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  requestResetEmail,
  resetPassword,
} from '../controllers/authController.js';

import {
  registerUserSchema,
  loginUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';

const router = express.Router();

// Auth basic
router.post('/auth/register', celebrate({ body: registerUserSchema }), registerUser);
router.post('/auth/login', celebrate({ body: loginUserSchema }), loginUser);
router.post('/auth/logout', logoutUser);
router.post('/auth/refresh', refreshUserSession);

// Password reset
router.post(
  '/auth/request-reset-email',
  celebrate({ body: requestResetEmailSchema }),
  requestResetEmail
);

router.post(
  '/auth/reset-password',
  celebrate({ body: resetPasswordSchema }),
  resetPassword
);

export default router;