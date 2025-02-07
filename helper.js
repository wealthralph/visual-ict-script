export async function activateProvidusCard(axiosClient, data, res) {
  const getAccountNumber = await axiosClient.get(
    `/fip/card/${data.accountNumber}`
  );

  console.log(data ,"this is the data here in sing")

  console.log(getAccountNumber?.data, "getAccountNumber");

  if (getAccountNumber.data.status !== true) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve account number",
    });
  }

  const cardId = getAccountNumber.data.data.id;
  const payload = { pin: data.pin, cardId };

  const changePin = await axiosClient.patch("/fip/card/pin", payload);

  console.log(changePin?.data, "changePin");

  if (changePin.data.status !== true) {
    return res.status(500).json({
      success: false,
      message: "Failed to change pin",
    });
  }
}

export async function activateInterSwitchCard(axiosClient, data, res) {
  const requiredFields = ["cvv", "cardPan", "expiry", "newPin"];

  if (requiredFields.some((field) => !data[field])) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const changePin = await axiosClient.post(
    "/customer/card/pin-selection",
    data
  );

  if (changePin.data.status !== true) {
    return res.status(500).json({
      success: false,
      message: "Failed to change pin",
    });
  }
}


export async function activateProvidusBulk(
  axiosClient,
  data,
  res,
  processedResults,
  failedRecords
) {
  for (const row of data) {
    try {
      await activateProvidusCard(axiosClient, row, res);

      processedResults.push({
        ...row,
        status: "success",
        message: "Pin Change Successful",
      });
    } catch (error) {
      console.error("@ERROR", error?.response?.data);

      failedRecords.push({
        ...row,
        status: "failed",
        message: "Failed to change pin",
        error: error?.response?.data || error.message,
      });
    }
  }
}


export async function activateInterSwitchBulk(
  axiosClient,
  data,
  res,
  processedResults,
  failedRecords
) {


  for (const row of data) {
    try {
      await activateInterSwitchCard(axiosClient, row, res);

      processedResults.push({
        ...row,
        status: "success",
        message: "Pin Change Successful",
      });

    } catch (error) {
      console.error("@ERROR", error?.response?.data);

      failedRecords.push({
        ...row,
        status: "failed",
        message: "Failed to change pin",
        error: error?.response?.data || error.message,
      });
    }
  }
}



// export const processInBatches = async (data, batchSize, axiosClient, mode, res) => {
//   const totalBatches = Math.ceil(data.length / batchSize);
//   const batchResults = [];

//   console.log(`🔢 Total Batches: ${totalBatches}`);

//   for (let batchNumber = 1; batchNumber <= totalBatches; batchNumber++) {
//     const startIdx = (batchNumber - 1) * batchSize;
//     const batch = data.slice(startIdx, startIdx + batchSize);

//     console.log(
//       `📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`
//     );

//     const processedRecords = [];
//     const failedRecords = [];

//     try {
//       if (mode === "Providus") {
//         await activateProvidusBulk(
//           axiosClient,
//           batch,
//           res,
//           processedRecords,
//           failedRecords
//         );
//       } else if (mode === "Interswitch") {
//         await activateInterSwitchBulk(
//           axiosClient,
//           batch,
//           res,
//           processedRecords,
//           failedRecords
//         );
//       }

//       processedRecords.forEach((r) => (r.batchNumber = batchNumber));
//       failedRecords.forEach((r) => (r.batchNumber = batchNumber));

//       batchResults.push({
//         batchNumber,
//         processedRecords,
//         failedRecords,
//       });

//       res.json({
//         success: true,
//         message: `Batch ${batchNumber} processed successfully`,
//         batchNumber,
//         processedRecords,
//         failedRecords,
//         totalBatches,
//       });
      
//     } catch (error) {
//       console.error(`❌ Batch ${batchNumber} failed`, error);
//       batch.forEach((row) =>
//         failedRecords.push({
//           ...row,
//           batchNumber,
//           error: "Batch processing failed",
//         })
//       );
//       batchResults.push({ batchNumber, processedRecords: [], failedRecords });

//       res.json({
//         success: false,
//         message: `Batch ${batchNumber} failed`,
//         batchNumber,
//         processedRecords: [],
//         failedRecords,
//         totalBatches,
//         error: "Batch processing failed",
//       });
//     }
//   }

//   return { batchResults, totalBatches };
// };


export async function processInBatches(results, batchLimit, axiosClient, mode, res) {
  const totalBatches = Math.ceil(results.length / batchLimit);
  const batchResults = [];

  for (let batchNumber = 0; batchNumber < totalBatches; batchNumber++) {
    const start = batchNumber * batchLimit;
    const end = start + batchLimit;
    const batch = results.slice(start, end);
    console.log(
      `📦 Processing batch ${batchNumber + 1}/${totalBatches} (${
        batch.length
      } records)...`
    );

    const processedRecords = [];
    const failedRecords = [];

    try {
      if (mode === "Providus") {
        await activateProvidusBulk(
          axiosClient,
          batch,
          res,
          processedRecords,
          failedRecords
        );
      } else if (mode === "Interswitch") {
        await activateInterSwitchBulk(
          axiosClient,
          batch,
          res,
          processedRecords,
          failedRecords
        );
      }

      processedRecords.forEach((r) => (r.batchNumber = batchNumber + 1));
      failedRecords.forEach((r) => (r.batchNumber = batchNumber + 1));

      batchResults.push({
        batchNumber: batchNumber + 1,
        processedRecords,
        failedRecords,
      });

      console.log(`✅ Batch ${batchNumber + 1} processed successfully`);
    } catch (error) {
      console.error(`❌ Batch ${batchNumber + 1} failed`, error);
      batch.forEach((row) =>
        failedRecords.push({
          ...row,
          batchNumber: batchNumber + 1,
          error: "Batch processing failed",
        })
      );

      batchResults.push({
        batchNumber: batchNumber + 1,
        processedRecords,
        failedRecords,
      });
    }
  }

  return { batchResults, totalBatches };
}

