import mongoose from "mongoose";
import { ROLES } from "../../constants/rbac.js";

const membershipSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.MEMBER },
    status: {
      type: String,
      enum: ["ACTIVE", "INVITED", "SUSPENDED"],
      default: "ACTIVE",
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    invitedAt: { type: Date },
  },
  { timestamps: true },
);

membershipSchema.index({ tenantId: 1, userId: 1, orgId: 1 }, { unique: true });

const Membership = mongoose.model("Membership", membershipSchema);

export default Membership;
