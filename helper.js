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


export async function activateProvidusBulk (axiosClient, data, res) {
  const processedResults = [];
  const failedRecords = [];

  for (const row of data) {
    try {
      await activateProvidusCard(axiosClient, row, res);

      processedResults.push({
        ...row,
        status: "success",
        message: "Pin Change Successful",
      });


          return res.json({
            success: true,
            message: "CSV processed successfully",
            processedRecords: processedResults,
            failedRecords: failedRecords,
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


export async function activateInterSwitchBulk (axiosClient, data, res) { 
  const processedResults = [];
  const failedRecords = [];

  for (const row of data) {
    try {
      await activateInterSwitchCard(axiosClient, row, res);

      processedResults.push({
        ...row,
        status: "success",
        message: "Pin Change Successful",
      });


         return res.json({
           success: true,
           message: "CSV processed successfully",
           processedRecords: processedResults,
           failedRecords: failedRecords,
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