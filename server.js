import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import asynchandler from "express-async-handler";
import connectDB from "./db.js";
import Token from "./token.schema.js";
import upload from "./multer.js";
import fs from "fs";
import csv from "csv-parser";
import {
  activateInterSwitchBulk,
  activateInterSwitchCard,
  activateProvidusBulk,
  activateProvidusCard,
} from "./helper.js";

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
      console.log(error);
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
        return res.status(200).json({
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

    const { mode } = req.query;

    console.log(JSON.stringify(mode), "this si the mode");

    try {
      if (mode === "Providus") {
        await activateProvidusCard(axiosClient, data, res);
      } else if (mode === "Interswitch") {
        await activateInterSwitchCard(axiosClient, data, res);
      }

      return res.status(200).json({
        success: true,
        message: "Pin Change Successful",
      });
    } catch (error) {
      console.error("@ERROR", error);

      return res.status(500).json({
        success: false,
        message: "Failed to change pin",
        error: error,
      });
    }
  })
);

router.post(
  "/activate-bulk",
  upload.single("file"),
  asynchandler(async (req, res, next) => {
    console.log("📌 Route reached: /activate-bulk");

    const { mode } = req.query;

    if (!req.file) {
      console.log("❌ No file uploaded!");
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

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

    const filePath = req.file.path;
    console.log(`✅ File uploaded: ${filePath}`);

    const results = [];

    fs.createReadStream(filePath, { encoding: "utf8" })
      .pipe(csv())
      .on("data", (row) => {
        console.log(`📄 Row:`, row);
        results.push({ ...row, status: "pending" });
      })
      .on("end", async () => {
        console.log(`✅ CSV Processing complete! ${results.length} rows.`);
        fs.unlinkSync(filePath);

        if (mode === "Providus") {
          await activateProvidusBulk(axiosClient, results, res);
        } else if (mode === "Interswitch") {
          await activateInterSwitchBulk(axiosClient, results, res);
        }
      })

      .on("error", (err) => {
        console.error("❌ CSV Processing Error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error processing CSV" });
      });
  })
);

app.use(router);

app.listen(4000, () => {
  console.log("listening on port 4000");
});
