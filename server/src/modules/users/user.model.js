import mongoose from "mongoose";
import {
  ROLES,
  getPermissionsForRole,
  normalizeRole,
} from "../../constants/rbac.js";

// Mapping for backwards compatibility with old role names
const LEGACY_ROLE_ALIASES = {
  USER: ROLES.MEMBER,
  EXPERT: ROLES.MEMBER,
};

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minlength: 8,
    },
    bio: {
      type: String,
      default: "",
      maxlength: 500,
      trim: true,
    },
    role: {
      type: String,
      enum: [...Object.values(ROLES), ...Object.keys(LEGACY_ROLE_ALIASES)],
      default: ROLES.MEMBER,
      set(value) {
        return normalizeRole(LEGACY_ROLE_ALIASES[value] || value);
      },
    },
    reputation: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    verified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      select: false,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.virtual("permissions").get(function permissions() {
  return getPermissionsForRole(this.role);
});

// Indexes
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ reputation: -1 });

// Strip sensitive fields from JSON output
userSchema.set("toJSON", {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
