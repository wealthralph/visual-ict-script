import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import axios from "axios";
import asynchandler from "express-async-handler";

dotenv.config();

const app = express();
const router = express.Router();

const axiosClient = axios.create({
  baseURL: "https://core-api.tagpay.ng/v1",
  headers: {
    Authorization: `Bearer ${process.env.API_TEST_KEY}`,
  },
});

app.use(
  cors({
    origin: ["http://localhost:5137", "https://visual-ict.onrender.com"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

router.get(
  "/activate",
  asynchandler(async (req, res) => {
    const data = req.body;

    try {
      const getAccoutnNumber = await axiosClient.get(
        `/fip/card/${data.accountNumber}`
      );

      const cardId = getAccoutnNumber.data.data.id;

      if (
        getAccoutnNumber.status !== 200 ||
        getAccoutnNumber.data.status !== true
      ) {
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

      const changePin = await axiosClient.post("/fip/card/pin", payload);

      if (changePin.status !== 200 || changePin.data.status !== true) {
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
      res.status(500).json({
        success: false,
        message: "Failed to change pin",
      });
      console.log(error)
    }
  })
);

app.use(router);

app.listen(4000, () => {
  console.log("listening on port 4000");
});
