import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    relatedIssue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    contributors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED"],
      default: "ACTIVE"
    }
  },
  { timestamps: true }
);

projectSchema.index({ tenantId: 1, createdAt: -1 });
projectSchema.index({ tenantId: 1, status: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
