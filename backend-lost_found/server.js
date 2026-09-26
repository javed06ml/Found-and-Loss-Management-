const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Item = require("./Item");
const Claim = require("./Claim");
const Admin = require("./Admin");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.send("Lost & Found Backend Running");
});

// ===============================
// ITEMS
// ===============================

// GET all items
app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch items",
      error: error.message,
    });
  }
});

// POST new item
app.post("/api/items", async (req, res) => {
  try {
    const item = await Item.create({
      ...req.body,
      status: req.body.status || "Reported",
    });

    res.status(201).json({
      message: "Item reported successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to report item",
      error: error.message,
    });
  }
});

// UPDATE ITEM STATUS
app.patch("/api/items/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    res.json({
      message: "Item status updated successfully",
      item,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update item status",
      error: error.message,
    });
  }
});

// ===============================
// CLAIMS
// ===============================

// GET ALL CLAIMS
app.get("/api/claims", async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate("itemId")
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch claims",
      error: error.message,
    });
  }
});

// POST CLAIM
app.post("/api/claims", async (req, res) => {
  try {
    const { itemId, reason, enrollmentNo, department } = req.body;

    if (!itemId || !reason || !enrollmentNo || !department) {
      return res.status(400).json({
        message:
          "Item, reason, enrollment number and department are required",
      });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    const claim = await Claim.create({
      itemId,
      reason,
      enrollmentNo,
      department,
      status: "Under Review",
    });

    // Item ko claim review me mark karo
    await Item.findByIdAndUpdate(itemId, {
      status: "Claim Under Review",
    });

    const populatedClaim = await Claim.findById(claim._id).populate("itemId");

    res.status(201).json({
      message: "Claim submitted successfully",
      claim: populatedClaim,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to submit claim",
      error: error.message,
    });
  }
});

// UPDATE CLAIM STATUS
app.patch("/api/claims/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Under Review",
      "Approved",
      "Rejected",
      "Handed Over",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid claim status",
      });
    }

    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    claim.status = status;
    await claim.save();

    // Item ka status bhi synchronize karo
    let itemStatus = "Claim Under Review";

    if (status === "Approved") {
      itemStatus = "Claim Approved";
    }

    if (status === "Rejected") {
      itemStatus = "Reported";
    }

    if (status === "Handed Over") {
      itemStatus = "Handed Over";
    }

    await Item.findByIdAndUpdate(claim.itemId, {
      status: itemStatus,
    });

    const updatedClaim = await Claim.findById(claim._id).populate("itemId");

    res.json({
      message: `Claim ${status.toLowerCase()} successfully`,
      claim: updatedClaim,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update claim status",
      error: error.message,
    });
  }
});

// ===============================
// ADMIN
// ===============================

// CREATE ADMIN ACCOUNT
app.post("/api/admin/setup", async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({
        message: "Name, username and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingAdmin = await Admin.findOne();

    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin account already exists",
      });
    }

    const admin = await Admin.create({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password,
    });

    res.status(201).json({
      message: "Admin account created successfully",
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    res.status(500).json({
      message: "Failed to create admin account",
      error: error.message,
    });
  }
});

// ADMIN LOGIN
app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const admin = await Admin.findOne({
      username: username.trim().toLowerCase(),
    });

    if (!admin || admin.password !== password) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    res.json({
      message: "Login successful",
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});

// ===============================
// MONGODB + SERVER
// ===============================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection Error:", error);
  });