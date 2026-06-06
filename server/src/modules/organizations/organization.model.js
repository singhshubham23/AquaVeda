import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: "", maxlength: 1000 },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

organizationSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
