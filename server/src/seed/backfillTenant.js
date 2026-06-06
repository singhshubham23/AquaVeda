import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../modules/users/user.model.js";
import Issue from "../modules/issues/issue.model.js";
import Project from "../modules/projects/project.model.js";
import Comment from "../modules/comments/comment.model.js";
import Wiki from "../modules/wiki/wiki.model.js";
import Report from "../modules/moderation/moderation.model.js";

dotenv.config();

const tenantId = process.env.DEFAULT_TENANT_ID || "public";

const backfillTenant = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const operations = [
    User.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } }),
    User.updateMany({ role: "USER" }, { $set: { role: "MEMBER" } }),
    User.updateMany({ role: "EXPERT" }, { $set: { role: "MEMBER" } }),
    Issue.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } }),
    Project.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } }),
    Comment.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } }),
    Wiki.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } }),
    Report.updateMany({ tenantId: { $exists: false } }, { $set: { tenantId } })
  ];

  await Promise.all(operations);
  console.log(`Tenant backfill complete with tenantId="${tenantId}"`);
};

backfillTenant()
  .catch((error) => {
    console.error("Backfill failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
