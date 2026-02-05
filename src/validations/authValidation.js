import Joi from 'joi';

const passwordSchema = Joi.string().min(8).required();

export const registerUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordSchema,
});

export const loginUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: passwordSchema,
});

export const requestResetEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  password: passwordSchema,
  token: Joi.string().required(),
});