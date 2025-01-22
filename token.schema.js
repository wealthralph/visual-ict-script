import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
});

const Token = mongoose.model("Token", tokenSchema);

export default Token;
