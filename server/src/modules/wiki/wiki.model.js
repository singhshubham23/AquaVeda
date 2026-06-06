import mongoose from "mongoose";

const wikiSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    type: {
      type: String,
      enum: ["ARTICLE", "QUESTION"],
      default: "ARTICLE"
    },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    tags: [String],
    region: {
      type: String,
      default: "global"
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED"],
      default: "PENDING"
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

wikiSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

const Wiki = mongoose.model("Wiki", wikiSchema);

export default Wiki;
