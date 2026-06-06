import { error } from "../utils/response.js";

export const notFound = (req, res) => {
  return error(res, "Route not found", 404);
};
