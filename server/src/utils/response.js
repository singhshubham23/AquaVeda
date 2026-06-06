export const sendResponse = (
  res,
  {
    success,
    message,
    status = 200,
    data = null,
    errors = null,
    meta = null
  }
) => {
  return res.status(status).json({
    success,
    message,
    data,
    errors,
    meta
  });
};

export const success = (res, data = null, message = "Success", status = 200, meta = null) => {
  return sendResponse(res, {
    success: true,
    message,
    status,
    data,
    meta
  });
};

export const error = (res, message = "Error", status = 400, errors = null) => {
  return sendResponse(res, {
    success: false,
    message,
    status,
    errors
  });
};
