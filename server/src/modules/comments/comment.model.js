import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    isAccepted: {
      type: Boolean,
      default: false
    },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    refType: {
      type: String,
      enum: ["ISSUE", "WIKI"],
      required: true
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    flagged: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

commentSchema.index({ tenantId: 1, refType: 1, refId: 1, createdAt: -1 });
commentSchema.index({ tenantId: 1, user: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
