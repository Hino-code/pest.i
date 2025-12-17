const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

dotenv.config();

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@ews.local").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "System Administrator";
const ADMIN_ROLE = process.env.ADMIN_ROLE || "Administrator";

// Validate critical environment variables
if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI. Set it in .env before starting the server.");
  process.exit(1);
}

if (!JWT_SECRET || JWT_SECRET === "change-me-in-prod") {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ JWT_SECRET must be set in production!");
    process.exit(1);
  }
  console.warn("⚠️  Using default/weak JWT_SECRET - NOT SECURE FOR PRODUCTION");
}

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Validation moved above

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" })); // Add body size limit
app.use("/uploads", express.static(UPLOAD_DIR));

// Rate limiting for auth endpoints
// Note: Install express-rate-limit: npm install express-rate-limit
// Uncomment the following code after installing:
/*
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  message: "Too many registration attempts, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
*/

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image uploads are allowed"));
    }
  },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    agency: { type: String },
    role: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved"], default: "pending" },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    jobTitle: { type: String },
    department: { type: String },
    location: { type: String },
    bio: { type: String },
    photoUrl: { type: String },
    theme: { type: String, default: "system" },
    language: { type: String, default: "en" },
    dateFormat: { type: String, default: "MM/DD/YYYY" },
    timeFormat: { type: String, default: "12" },
    density: { type: String, default: "comfortable" },
  },
  { timestamps: true },
);

// Use explicit collection name to ensure we're using the right collection
const User = mongoose.model("User", userSchema, "users");

const toAppUser = (user, req) => {
  const photoUrl = user.photoUrl ?? "";
  // Convert relative path to absolute URL
  const absolutePhotoUrl =
    photoUrl && !photoUrl.startsWith("http")
      ? `${req.protocol}://${req.get("host")}${photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`}`
      : photoUrl;
  
  return {
    id: user._id.toString(),
    username: user.name || user.email,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone ?? "",
    jobTitle: user.jobTitle ?? "",
    department: user.department ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
    photoUrl: absolutePhotoUrl,
    theme: user.theme ?? "system",
    language: user.language ?? "en",
    dateFormat: user.dateFormat ?? "MM/DD/YYYY",
    timeFormat: user.timeFormat ?? "12",
    density: user.density ?? "comfortable",
  };
};

const toPendingUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  agency: user.agency ?? "",
  role: user.role,
  submittedAt: user.createdAt.toISOString(),
});

const createToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (req.user.role !== "Administrator") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  });
};

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Debug endpoint to list all users (admin only, disabled in production)
app.get("/debug/users", requireAdmin, async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Not found" });
  }
  try {
    const users = await User.find({}).select("-passwordHash").limit(50);
    res.json({ 
      count: users.length,
      users: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
      }))
    });
  } catch (error) {
    console.error("Debug users error:", error);
    res.status(500).json({ message: "Failed to list users", error: error.message });
  }
});

// Apply rate limiting: app.post("/auth/register", registerLimiter, async (req, res) => {
app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, agency, role, password } = req.body || {};
    if (!name || !email || !role || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      agency,
      role,
      passwordHash,
      status: "pending",
    });

    res.status(201).json({ pendingId: user._id.toString() });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Apply rate limiting: app.post("/auth/login", authLimiter, async (req, res) => {
app.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const email = username.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      console.log(`Login attempt failed: Invalid password for email: ${email}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.status !== "approved") {
      console.log(`Login attempt: User ${email} is not approved (status: ${user.status})`);
      return res.status(401).json({ message: "Account pending approval" });
    }

    const token = createToken(user);
    console.log(`Login successful for user: ${email} (${user.role})`);
    res.json({
      token,
      user: toAppUser(user, req),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

app.get("/user/me", requireAuth, async (req, res) => {
  res.json({ user: toAppUser(req.user, req) });
});

app.patch("/user/me", requireAuth, async (req, res) => {
  try {
    const allowed = [
      "name",
      "phone",
      "jobTitle",
      "department",
      "location",
      "bio",
      "photoUrl",
      "theme",
      "language",
      "dateFormat",
      "timeFormat",
      "density",
    ];
    allowed.forEach((field) => {
      if (field in req.body) {
        req.user[field] = req.body[field];
      }
    });
    await req.user.save();
    res.json({ user: toAppUser(req.user, req) });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

app.patch("/user/me/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing password fields" });
    }
    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    res.status(204).end();
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
});

app.post(
  "/user/me/photo",
  requireAuth,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const outputFilename = `${unique}.jpg`;
      const outputPath = path.join(UPLOAD_DIR, outputFilename);

      try {
        await sharp(req.file.buffer)
          .rotate()
          .resize(800, 800, { fit: "cover" })
          .jpeg({ quality: 90 })
          .toFile(outputPath);
      } catch (err) {
        console.error("Image processing failed, saving raw buffer:", err);
        await fs.promises.writeFile(outputPath, req.file.buffer);
      }

      const publicPath = `/uploads/${outputFilename}`;
      req.user.photoUrl = publicPath;
      await req.user.save();
      res.json({ photoUrl: `${req.protocol}://${req.get("host")}${publicPath}`, user: toAppUser(req.user, req) });
    } catch (error) {
      console.error("Upload photo error:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  },
);

app.get("/admin/pending-users", requireAdmin, async (req, res) => {
  try {
    const pending = await User.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(pending.map(toPendingUser));
  } catch (error) {
    console.error("List pending error:", error);
    res.status(500).json({ message: "Failed to load pending users" });
  }
});

app.post("/admin/pending-users/:id/approve", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, status: "pending" });
    if (!user) {
      return res.status(404).json({ message: "Pending user not found" });
    }
    user.status = "approved";
    await user.save();
    res.status(204).end();
  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ message: "Failed to approve user" });
  }
});

app.post("/admin/pending-users/:id/reject", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, status: "pending" });
    if (!user) {
      return res.status(404).json({ message: "Pending user not found" });
    }
    await user.deleteOne();
    res.status(204).end();
  } catch (error) {
    console.error("Reject error:", error);
    res.status(500).json({ message: "Failed to reject user" });
  }
});

// Centralized error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === "production" 
    ? "Internal server error" 
    : err.message || "An error occurred";
  
  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    // Add database indexes for performance
    // Note: email index is already created by Mongoose schema (unique: true)
    // Skip email index creation since it's handled by the schema
    // Create other indexes with error handling
    const indexes = [
      { key: { status: 1 }, options: { background: true } },
      { key: { role: 1 }, options: { background: true } },
      { key: { createdAt: -1 }, options: { background: true } },
    ];
    
    for (const index of indexes) {
      try {
        await User.collection.createIndex(index.key, index.options);
      } catch (err) {
        // Index may already exist or conflict, which is fine
        if (err.code !== 86 && err.codeName !== "IndexKeySpecsConflict") {
          console.warn(`⚠️  Index creation warning: ${err.message}`);
        }
      }
    }
    console.log("✅ Database indexes created");
    
    // Ensure an admin account exists for bootstrap
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        agency: "",
        role: ADMIN_ROLE,
        status: "approved",
        passwordHash,
      });
      console.log(`👤 Seeded admin user at ${ADMIN_EMAIL} (role: ${ADMIN_ROLE})`);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 API listening on http://localhost:${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
