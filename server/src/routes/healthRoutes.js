import { Router } from "express";
import { success } from "../utils/response.js";

const router = Router();

router.get("/", (req, res) => {
  return success(res, { status: "ok" }, "Aquaveda health check OK");
});

export default router;
