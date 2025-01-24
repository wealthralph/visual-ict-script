import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import asynchandler from "express-async-handler";
import connectDB from "./db.js";
import Token from "./token.schema.js";

dotenv.config();
connectDB();

const app = express();
const router = express.Router();

app.use(cors());

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

router.post(
  "/token",
  asynchandler(async (req, res) => {
    const { token } = req.body;

    try {
      const newToken = new Token({ token });
      await newToken.save();


      res.status(200).json({
        success: true,
        message: "Token saved successfully",
      });
    } catch (error) {
      console.log(error)
      res.status(500).json({
        success: false,
        message: "Failed to save token",
        error: error.message,
      });
    }
  })
);

router.post(
  "/verifyPin",
  asynchandler(async (req, res) => {
    const { token } = req.body;



    const adminPin = 4035;

    try {
      if (Number(token) === adminPin) {
      return  res.status(200).json({
          success: true,
          message: "Admin verified succesfully",
        });
      }

       res.status(500).json({
         success: false,
         message: "Authorization failed",
       });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Authorization failed",
      });
    }
  })
);

router.post(
  "/activate",
  asynchandler(async (req, res) => {
    const data = req.body;

    let token;

    const tokenDoc = await Token.findOne();
    if (!tokenDoc) {
      token = process.env.API_KEY;
    } else {
      token = tokenDoc.token;
    }

    const axiosClient = axios.create({
      baseURL: "https://core-api.tagpay.ng/v1",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });


    try {
      const getAccountNumber = await axiosClient.get(
        `/fip/card/${data.accountNumber}`
      );


      console.log(getAccountNumber, "getAccountNumber");

      if (getAccountNumber.data.status !== true) {
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve account number",
        });
      }

      const cardId = getAccountNumber.data.data.id;
      const payload = { pin: data.pin, cardId };


      const changePin = await axiosClient.patch("/fip/card/pin", payload);

      console.log(changePin, "changePin");

      if (changePin.data.status !== true) {
        return res.status(500).json({
          success: false,
          message: "Failed to change pin",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Pin Change Successful",
      });
    } catch (error) {
      console.error("@ERROR", error?.response?.data);

      return res.status(500).json({
        success: false,
        message: "Failed to change pin",
        error: error
      });
    }
  })
);



app.use(router);

app.listen(4000, () => {
  console.log("listening on port 4000");
});
