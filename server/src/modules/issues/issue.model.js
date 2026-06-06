import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["CREATED", "UPDATED", "ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "VERIFIED"],
      required: true
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    note: {
      type: String,
      default: ""
    }
  },
  { timestamps: true, _id: false }
);

const issueSchema = new mongoose.Schema(
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
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator(value) {
            return Array.isArray(value) && value.length === 2;
          },
          message: "Coordinates must be [lng, lat]"
        }
      }
    },
    category: {
      type: String,
      default: "GENERAL"
    },
    isSpam: {
      type: Boolean,
      default: false
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW"
    },
    region: {
      type: String,
      default: "global",
      trim: true
    },
    images: [String],
    imageThumbnails: [String],
    embedding: {
      type: [Number],
      default: []
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "VERIFIED"],
      default: "OPEN"
    },
    timeline: [timelineEntrySchema]
  },
  { timestamps: true }
);

// Indexes
issueSchema.index({ location: "2dsphere" });
issueSchema.index({ tenantId: 1, status: 1, severity: 1 });
issueSchema.index({ tenantId: 1, reportedBy: 1, createdAt: -1 });
issueSchema.index({ tenantId: 1, region: 1 });

const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
