import Joi from "joi";
import { Types } from "mongoose";

const objectIdValidation = (value, helper) => {
  const isValid = Types.ObjectId.isValid(value);
  return isValid ? value : helper.message("Invalid ObjectId");
};

export const generalRules = {
  _id: Joi.string().custom(objectIdValidation),
  headers: {
    "content-type": Joi.string(),
    accept: Joi.string(),
    "accept-encoding": Joi.string(),
    host: Joi.string(),
    "content-length": Joi.number().optional(),
    "user-agent": Joi.string(),
    "accept-language": Joi.string(),
    "accept-charset": Joi.string(),
    "postman-token": Joi.string(),
    "postman-id": Joi.string(),
    connection:Joi.string(),
  },
  email: Joi.string().email({
    minDomainSegments: 2,
  }),
  password: Joi.string()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$!%*?&])[A-Za-z\d$!%*?&]{8,}$/
    )
    .messages({
      "string.pattern.base":
        "Password must have at least one lowercase letter, one uppercase letter, one number and one special character",
      "any.required": "You need to provide a password",
      "string.min": "Password should have a minimum length of 3 characters",
    }),
};
