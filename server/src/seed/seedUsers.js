import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../modules/users/user.model.js";

dotenv.config();

const getSeedPassword = (envName) => {
  const value = process.env[envName];
  if (!value) {
    throw new Error(`${envName} is required for seeding users`);
  }

  if (value.length < 12) {
    throw new Error(`${envName} must be at least 12 characters`);
  }

  return value;
};

const seedUsers = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  const tenantId = (process.env.SEED_TENANT_ID || process.env.DEFAULT_TENANT_ID || "public")
    .trim()
    .toLowerCase();

  const seedData = [
    {
      name: "Admin",
      email: (process.env.ADMIN_SEED_EMAIL || "admin@aquaveda.com").toLowerCase(),
      password: getSeedPassword("ADMIN_SEED_PASSWORD"),
      role: "ADMIN",
      tenantId
    },
    {
      name: "Member",
      email: (process.env.MEMBER_SEED_EMAIL || "member@aquaveda.com").toLowerCase(),
      password: getSeedPassword("MEMBER_SEED_PASSWORD"),
      role: "MEMBER",
      tenantId
    }
  ];

  await mongoose.connect(process.env.MONGO_URI);

  for (const item of seedData) {
    const hashedPassword = await bcrypt.hash(item.password, 10);

    await User.updateOne(
      { email: item.email, tenantId: item.tenantId },
      {
        $set: {
          name: item.name,
          tenantId: item.tenantId,
          role: item.role,
          password: hashedPassword,
          verified: true
        },
        $setOnInsert: {
          reputation: 0
        }
      },
      { upsert: true }
    );
  }

  console.log(
    `Seed users ready: ${seedData.map((item) => item.email).join(", ")}`
  );
};

seedUsers()
  .catch((error) => {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
