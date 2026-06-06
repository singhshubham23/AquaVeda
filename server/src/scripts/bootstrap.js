#!/usr/bin/env node
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import { pathToFileURL } from "node:url";
import { connectDB, disconnectDB } from "../config/db.js";
import Organization from "../modules/organizations/organization.model.js";
import Membership from "../modules/organizations/membership.model.js";
import User from "../modules/users/user.model.js";
import { ROLES } from "../constants/rbac.js";
import logger from "../config/logger.js";

const ADMIN_EMAIL = (
  process.env.ADMIN_SEED_EMAIL || "admin@aquaveda.com"
).toLowerCase();
const TENANT_ID = process.env.ADMIN_SEED_TENANT || "public";

const getSeedPassword = () => {
  const value = process.env.ADMIN_SEED_PASSWORD;
  if (!value) {
    throw new Error("ADMIN_SEED_PASSWORD is required for bootstrap");
  }

  if (value.length < 12) {
    throw new Error("ADMIN_SEED_PASSWORD must be at least 12 characters");
  }

  return value;
};

const run = async () => {
  await connectDB();

  try {
    // Ensure a system organization exists
    let org = await Organization.findOne({
      tenantId: TENANT_ID,
      slug: "system",
    });
    if (!org) {
      org = await Organization.create({
        tenantId: TENANT_ID,
        name: "System",
        slug: "system",
        description: "System organization",
      });
      logger.info("Created System organization");
    }

    // Ensure admin user exists
    let user = await User.findOne({
      email: ADMIN_EMAIL,
      tenantId: TENANT_ID,
    }).select("+password");
    if (!user) {
      const hashed = await bcrypt.hash(getSeedPassword(), 10);
      user = await User.create({
        tenantId: TENANT_ID,
        name: "System Admin",
        email: ADMIN_EMAIL,
        password: hashed,
        role: ROLES.ADMIN,
        verified: true,
      });
      logger.info("Created System admin user");
    }

    // Ensure membership linking admin -> system org
    const existing = await Membership.findOne({
      tenantId: TENANT_ID,
      userId: user._id,
      orgId: org._id,
    });
    if (!existing) {
      await Membership.create({
        tenantId: TENANT_ID,
        userId: user._id,
        orgId: org._id,
        role: ROLES.ADMIN,
        status: "ACTIVE",
      });
      logger.info("Created admin membership for System org");
    }

    logger.info("Bootstrap completed successfully");
  } catch (err) {
    logger.error("Bootstrap failed", { message: err.message });
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
