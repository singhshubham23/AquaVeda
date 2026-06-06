import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    refType: {
      type: String,
      enum: ["ISSUE", "COMMENT", "WIKI", "USER"],
      required: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    reason: {
      type: String,
      enum: ["SPAM", "INAPPROPRIATE", "HARASSMENT", "OTHER"],
      required: true
    },
    details: {
      type: String,
      maxlength: 1000,
      default: ""
    },
    status: {
      type: String,
      enum: ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"],
      default: "PENDING"
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewNotes: {
      type: String,
      maxlength: 1000,
      default: ""
    }
  },
  { timestamps: true }
);

reportSchema.index({ tenantId: 1, status: 1, createdAt: 1 });
reportSchema.index({ tenantId: 1, refType: 1, refId: 1 });
reportSchema.index({ tenantId: 1, reportedBy: 1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
