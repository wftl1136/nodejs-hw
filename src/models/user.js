import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String },
    password: { type: String, required: true },
    avatar: {
      type: String,
      default: "https://ac.goit.global/fullstack/react/default-avatar.jpg",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (!this.username) {
    this.username = this.email;
  }
  next();
});

export const User = model("User", userSchema);