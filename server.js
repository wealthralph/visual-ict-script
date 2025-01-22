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

      res.status(201).json({
        success: true,
        message: "Token saved successfully",
        data: newToken,
      });
    } catch (error) {
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


    console.log("something is runnnnnnnnnnnnnnnnn")

    const adminPin = 4035;

    try {
      if (Number(token) === adminPin) {
        res.status(200).json({
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
      // return res.status(500).json({
      //   success: false,
      //   message: "Failed to retrieve token",
      // });
      token = process.env.API_KEY;
    }

    token = tokenDoc.token;

    const axiosClient = axios.create({
      baseURL: "https://core-api.tagpay.ng/v1",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    try {
      const getAccoutnNumber = await axiosClient.get(
        `/fip/card/${data.accountNumber}`
      );

      const cardId = getAccoutnNumber.data.data.id;

      console.log("@CARD-ID", cardId);

      if (getAccoutnNumber.data.status !== true) {
        res.status(500).json({
          success: false,
          message: "Failed to retrieve account number ",
        });

        throw new Error("Failed to retrieve account number");
      }

      const payload = {
        pin: data.cardPin,
        cardId,
      };

      const changePin = await axiosClient.patch("/fip/card/pin", payload);

      if (changePin.data.status !== true) {
        res.status(500).json({
          success: false,
          message: "Failed to retrieve account number ",
        });

        throw new Error("Failed to retrieve account number");
      }

      res.status(200).json({
        success: false,
        message: "Pin Change Succesful",
      });

      console.log(response.data, "this is the respons data");
    } catch (error) {
      console.log("@ERORR", error?.response.data);

      res.status(500).json({
        success: false,
        message: "Failed to change pin",
      });
    }
  })
);

app.use(router);

app.listen(4000, () => {
  console.log("listening on port 4000");
});
