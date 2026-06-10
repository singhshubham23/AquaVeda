import "dotenv/config";
import assert from "node:assert/strict";
import test, { after, before } from "node:test";
import mongoose from "mongoose";

process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test_secret_that_is_long_enough_for_api_checks";
process.env.JWT_EXPIRES = process.env.JWT_EXPIRES || "15m";
process.env.REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "1d";

const mongoUri = process.env.STAGING_MONGO_URI || process.env.TEST_MONGO_URI || "";
const tenantId = `api-smoke-${Date.now()}-${Math.random()
  .toString(16)
  .slice(2)}`;

let app;
let server;
let baseUrl;
let User;
let Issue;
let Wiki;
let Comment;
let Project;

const request = async (path, options = {}) => {
  const headers = {
    "content-type": "application/json",
    "x-tenant-id": tenantId,
    ...(options.headers || {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { response, payload };
};

before(async () => {
  if (!mongoUri) return;

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  [{ default: app }, { default: User }, { default: Issue }, { default: Wiki }, { default: Comment }, { default: Project }] =
    await Promise.all([
      import("../app.js"),
      import("../modules/users/user.model.js"),
      import("../modules/issues/issue.model.js"),
      import("../modules/wiki/wiki.model.js"),
      import("../modules/comments/comment.model.js"),
      import("../modules/projects/project.model.js"),
    ]);

  await Promise.all([
    User.deleteMany({ tenantId }),
    Issue.deleteMany({ tenantId }),
    Wiki.deleteMany({ tenantId }),
    Comment.deleteMany({ tenantId }),
    Project.deleteMany({ tenantId }),
  ]);

  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;
});

after(async () => {
  if (mongoUri) {
    await Promise.all([
      User?.deleteMany({ tenantId }),
      Issue?.deleteMany({ tenantId }),
      Wiki?.deleteMany({ tenantId }),
      Comment?.deleteMany({ tenantId }),
      Project?.deleteMany({ tenantId }),
    ]);
  }

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
});

test(
  "critical API flow: auth, access control, issues, wiki, comments",
  { skip: !mongoUri ? "Set STAGING_MONGO_URI or TEST_MONGO_URI to run DB smoke tests" : false },
  async () => {
    const email = `member-${Date.now()}@example.test`;
    const password = "Member123";

    const register = await request("/auth/register", {
      method: "POST",
      body: { name: "Smoke Contributor", email, password },
    });
    assert.equal(register.response.status, 201);
    assert.equal(register.payload.success, true);
    assert.equal(register.payload.data.role, "MEMBER");

    const login = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    assert.equal(login.response.status, 200);
    assert.ok(login.payload.data.accessToken);
    assert.ok(login.payload.data.refreshToken);

    const authHeaders = {
      authorization: `Bearer ${login.payload.data.accessToken}`,
    };

    const me = await request("/auth/me", { headers: authHeaders });
    assert.equal(me.response.status, 200);
    assert.equal(me.payload.data.email, email);

    const adminDashboard = await request("/dashboard/admin", {
      headers: authHeaders,
    });
    assert.equal(adminDashboard.response.status, 403);

    const issue = await request("/issues", {
      method: "POST",
      headers: authHeaders,
      body: {
        title: "Smoke test water leak",
        description: "A controlled staging issue created by the API smoke test.",
        severity: "MEDIUM",
        region: "staging",
        location: {
          type: "Point",
          coordinates: [77.209, 28.6139],
        },
      },
    });
    assert.equal(issue.response.status, 201);
    assert.equal(issue.payload.data.title, "Smoke test water leak");

    const comment = await request("/comments", {
      method: "POST",
      headers: authHeaders,
      body: {
        refType: "issue",
        refId: issue.payload.data._id,
        content: "Smoke test discussion comment.",
      },
    });
    assert.equal(comment.response.status, 201);
    assert.equal(comment.payload.data.refType, "ISSUE");

    const comments = await request(
      `/comments?refType=issue&refId=${issue.payload.data._id}`,
    );
    assert.equal(comments.response.status, 200);
    assert.equal(comments.payload.data.items.length, 1);

    const wiki = await request("/wiki", {
      method: "POST",
      headers: authHeaders,
      body: {
        type: "QUESTION",
        title: "How should staging smoke tests handle leaks?",
        content: "This is a staging-only question created by automated checks.",
        region: "staging",
        tags: ["smoke", "staging"],
      },
    });
    assert.equal(wiki.response.status, 201);
    assert.equal(wiki.payload.data.type, "QUESTION");

    const mine = await request("/wiki/mine", { headers: authHeaders });
    assert.equal(mine.response.status, 200);
    assert.equal(mine.payload.data.items.length, 1);

    const refresh = await request("/auth/refresh", {
      method: "POST",
      body: { refreshToken: login.payload.data.refreshToken },
    });
    assert.equal(refresh.response.status, 200);
    assert.ok(refresh.payload.data.accessToken);

    const logout = await request("/auth/logout", {
      method: "POST",
      headers: authHeaders,
      body: {},
    });
    assert.equal(logout.response.status, 200);
  },
);
