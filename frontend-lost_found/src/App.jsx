import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

const emptyForm = {
  title: "",
  category: "",
  location: "",
  date: "",
  description: "",
  type: "Found",
  contactName: "",
  contactNumber: "",
  image: "",
};

function App() {
  const [items, setItems] = useState([]);
  const [claims, setClaims] = useState([]);

  const [view, setView] = useState("home");
  const [search, setSearch] = useState("");
  const [claimItem, setClaimItem] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [claimForm, setClaimForm] = useState({
    reason: "",
    enrollmentNo: "",
    department: "",
  });

  const [adminLoggedIn, setAdminLoggedIn] = useState(
    localStorage.getItem("adminLoggedIn") === "true"
  );

  const [adminMode, setAdminMode] = useState("login");

  const [adminForm, setAdminForm] = useState({
    name: "",
    username: "",
    password: "",
  });

  const [claimLoading, setClaimLoading] = useState(false);

  // ===============================
  // LOAD ITEMS
  // ===============================

  const loadItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/items`);
      const data = await response.json();

      if (response.ok) {
        setItems(data);
      }
    } catch (error) {
      console.log("Backend connection error");
    }
  };

  // ===============================
  // LOAD CLAIMS
  // ===============================

  const loadClaims = async () => {
    try {
      const response = await fetch(`${API_URL}/api/claims`);
      const data = await response.json();

      if (response.ok) {
        setClaims(data);
      }
    } catch (error) {
      console.log("Failed to load claims");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // ===============================
  // NAVIGATION
  // ===============================

  const goTo = (nextView) => {
    setView(nextView);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    if (nextView === "admin" && adminLoggedIn) {
      loadItems();
      loadClaims();
    }
  };

  // ===============================
  // REPORT FORM
  // ===============================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("Image should be less than 4MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not report item.");
        return;
      }

      alert("Item reported successfully!");

      setForm(emptyForm);

      await loadItems();

      goTo("home");
    } catch (error) {
      alert("Backend server is not connected.");
    }
  };

  // ===============================
  // SEARCH
  // ===============================

  const filteredItems = items.filter((item) => {
    const text = search.toLowerCase().trim();

    if (!text) return true;

    return [
      item.title,
      item.category,
      item.location,
      item.type,
      item.contactName,
    ].some((value) =>
      value?.toLowerCase().includes(text)
    );
  });

  const lostCount = items.filter(
    (item) => item.type === "Lost"
  ).length;

  const foundCount = items.filter(
    (item) => item.type === "Found"
  ).length;

  const claimedCount = items.filter((item) =>
    ["Claimed", "Handed Over"].includes(item.status)
  ).length;

  // ===============================
  // CLAIM SUBMIT
  // ===============================

  const submitClaim = async (e) => {
    e.preventDefault();

    if (!claimItem) return;

    try {
      const response = await fetch(`${API_URL}/api/claims`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: claimItem._id,
          ...claimForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not submit claim.");
        return;
      }

      alert("Claim submitted successfully!");

      setClaimItem(null);

      setClaimForm({
        reason: "",
        enrollmentNo: "",
        department: "",
      });

      await loadItems();
      await loadClaims();
    } catch (error) {
      alert("Backend server is not connected.");
    }
  };

  // ===============================
  // ADMIN FORM
  // ===============================

  const handleAdminChange = (e) => {
    setAdminForm({
      ...adminForm,
      [e.target.name]: e.target.value,
    });
  };

  // ===============================
  // ADMIN SETUP
  // ===============================

  const setupAdmin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/admin/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminForm),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not create admin account.");
        return;
      }

      alert("Admin account created. Please login.");

      setAdminMode("login");

      setAdminForm({
        name: "",
        username: adminForm.username,
        password: "",
      });
    } catch (error) {
      alert("Backend server is not connected.");
    }
  };

  // ===============================
  // ADMIN LOGIN
  // ===============================

  const loginAdmin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: adminForm.username,
          password: adminForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Invalid login.");
        return;
      }

      localStorage.setItem("adminLoggedIn", "true");
      localStorage.setItem("adminName", data.admin.name);

      setAdminLoggedIn(true);

      await loadItems();
      await loadClaims();

      setAdminForm({
        name: "",
        username: "",
        password: "",
      });
    } catch (error) {
      alert("Backend server is not connected.");
    }
  };

  // ===============================
  // UPDATE CLAIM STATUS
  // ===============================

  const updateClaimStatus = async (claimId, status) => {
    try {
      setClaimLoading(true);

      const response = await fetch(
        `${API_URL}/api/claims/${claimId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Could not update claim.");
        return;
      }

      alert(`Claim ${status} successfully!`);

      await loadClaims();
      await loadItems();
    } catch (error) {
      alert("Could not connect to backend.");
    } finally {
      setClaimLoading(false);
    }
  };

  // ===============================
  // LOGOUT
  // ===============================

  const logoutAdmin = () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("adminName");

    setAdminLoggedIn(false);
    setClaims([]);
  };

  return (
    <div className="app">

      {/* NAVBAR */}
      <header className="navbar">

        <button
          className="brand"
          onClick={() => goTo("home")}
        >
          <div className="brand-logo">
            LF
          </div>

          <div>
            <strong>
              Campus Lost & Found
            </strong>

            <span>
              Claim Management Portal
            </span>
          </div>
        </button>

        <nav>

          <button
            className={view === "home" ? "active" : ""}
            onClick={() => goTo("home")}
          >
            Home
          </button>

          <button
            className={view === "report" ? "active" : ""}
            onClick={() => goTo("report")}
          >
            Report Item
          </button>

          <button
            className={view === "search" ? "active" : ""}
            onClick={() => goTo("search")}
          >
            Browse Items
          </button>

          <button
            className={view === "admin" ? "active" : ""}
            onClick={() => goTo("admin")}
          >
            Admin
          </button>

        </nav>
      </header>

      {/* HOME */}
      {view === "home" && (
        <>
          <section className="hero">

            <div className="hero-copy">

              <span className="eyebrow">
                CAMPUS COMMUNITY • LOST & FOUND
              </span>

              <h1>
                Find it. Report it.
                <br />
                <em>Return it home.</em>
              </h1>

              <p>
                One simple place to report lost belongings,
                discover found items and submit verified
                claims across campus.
              </p>

              <div className="hero-actions">

                <button
                  className="primary-btn"
                  onClick={() => goTo("report")}
                >
                  ＋ Report an Item
                </button>

                <button
                  className="secondary-btn"
                  onClick={() =>
                    document
                      .getElementById("latest-items")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                >
                  Explore Items ↓
                </button>

              </div>

              <div className="hero-trust">
                <span>✓ Easy reporting</span>
                <span>✓ Direct contact</span>
                <span>✓ Claim verification</span>
              </div>

            </div>

            <div className="hero-art">

              <div className="art-orbit orbit-one"></div>
              <div className="art-orbit orbit-two"></div>

              <div className="art-center">
                🔎
              </div>

              <div className="mini-card mini-top">
                <b>Found</b>
                <span>Ready to be claimed</span>
              </div>

              <div className="mini-card mini-bottom">
                <b>{items.length}</b>
                <span>Campus reports</span>
              </div>

            </div>

          </section>

          <section className="stats">

            <div>
              <span>◉</span>

              <p>
                Total Reports
                <strong>{items.length}</strong>
              </p>
            </div>

            <div>
              <span>!</span>

              <p>
                Lost Items
                <strong>{lostCount}</strong>
              </p>
            </div>

            <div>
              <span>✓</span>

              <p>
                Found Items
                <strong>{foundCount}</strong>
              </p>
            </div>

            <div>
              <span>◆</span>

              <p>
                Claimed / Returned
                <strong>{claimedCount}</strong>
              </p>
            </div>

          </section>

          <section
            className="latest-section"
            id="latest-items"
          >

            <div className="section-heading">

              <div>

                <span className="eyebrow">
                  LIVE CAMPUS BOARD
                </span>

                <h2>
                  Latest Lost & Found Items
                </h2>

                <p>
                  Recent reports are shown first so you
                  can quickly spot a matching item.
                </p>

              </div>

              <button
                className="text-btn"
                onClick={() => goTo("search")}
              >
                View all items →
              </button>

            </div>

            {items.length === 0 ? (

              <div className="empty-card">

                <div>📦</div>

                <h3>
                  No reports yet
                </h3>

                <p>
                  Be the first person to report a
                  lost or found item.
                </p>

                <button
                  className="primary-btn"
                  onClick={() => goTo("report")}
                >
                  Report an Item
                </button>

              </div>

            ) : (

              <div className="item-grid">

                {items
                  .slice(0, 6)
                  .map((item) => (
                    <ItemCard
                      key={item._id}
                      item={item}
                      onClaim={() =>
                        setClaimItem(item)
                      }
                    />
                  ))}

              </div>

            )}

          </section>

          <section className="how-section">

            <div className="section-heading centered">

              <span className="eyebrow">
                SIMPLE PROCESS
              </span>

              <h2>
                From report to return
              </h2>

            </div>

            <div className="steps">

              <div>
                <b>01</b>
                <span>📢</span>

                <h3>Report</h3>

                <p>
                  Add the item details, image and
                  contact information.
                </p>
              </div>

              <div>
                <b>02</b>
                <span>🔎</span>

                <h3>Discover</h3>

                <p>
                  Search recent campus reports using
                  title, category or location.
                </p>
              </div>

              <div>
                <b>03</b>
                <span>🛡️</span>

                <h3>Claim</h3>

                <p>
                  Provide ownership details so the
                  claim can be reviewed.
                </p>
              </div>

            </div>

          </section>
        </>
      )}

      {/* REPORT PAGE */}
      {view === "report" && (

        <section className="page">

          <div className="page-heading">

            <span className="eyebrow">
              REPORT AN ITEM
            </span>

            <h1>
              Help someone find what they lost.
            </h1>

            <p>
              Share clear details and a contact
              number so the right person can reach you.
            </p>

          </div>

          <form
            className="form-card"
            onSubmit={handleSubmit}
          >

            <div className="form-top">

              <span>＋</span>

              <div>
                <h2>Item details</h2>
                <p>
                  Fields marked * are required.
                </p>
              </div>

            </div>

            <div className="form-grid">

              <Field label="Item Type *">

                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="Found">
                    Found Item
                  </option>

                  <option value="Lost">
                    Lost Item
                  </option>
                </select>

              </Field>

              <Field label="Item Title *">

                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Black wallet"
                  required
                />

              </Field>

              <Field label="Category *">

                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Wallet, Phone, ID Card"
                  required
                />

              </Field>

              <Field label="Location *">

                <input
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  placeholder="e.g. Central Library"
                  required
                />

              </Field>

              <Field label="Date *">

                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />

              </Field>

              <Field label="Contact Name *">

                <input
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />

              </Field>

              <Field label="Contact Number *">

                <input
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  required
                />

              </Field>

            </div>

            <div className="upload-box">

              <div className="upload-copy">

                <span>🖼️</span>

                <div>

                  <strong>
                    Item Image
                  </strong>

                  <p>
                    Add a clear photo to make
                    identification easier.
                  </p>

                </div>

              </div>

              <label className="upload-btn">

                Choose Image

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImage}
                />

              </label>

            </div>

            {form.image && (

              <div className="preview">

                <img
                  src={form.image}
                  alt="Item preview"
                />

                <button
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      image: "",
                    })
                  }
                >
                  Remove image
                </button>

              </div>

            )}

            <Field label="Description">

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Color, brand, identifying marks, condition or any useful detail..."
              />

            </Field>

            <div className="form-submit">

              <span>
                🔒 Your report is stored in the
                campus system.
              </span>

              <button
                className="primary-btn"
                type="submit"
              >
                Submit Report →
              </button>

            </div>

          </form>

        </section>
      )}

      {/* SEARCH */}
      {view === "search" && (

        <section className="page">

          <div className="page-heading">

            <span className="eyebrow">
              CAMPUS ITEM DIRECTORY
            </span>

            <h1>
              Browse Lost & Found
            </h1>

            <p>
              Search by item name, category,
              location or contact name.
            </p>

          </div>

          <div className="search-bar">

            <span>⌕</span>

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search items..."
            />

            <b>
              {filteredItems.length} results
            </b>

          </div>

          <div className="item-grid">

            {filteredItems.map((item) => (

              <ItemCard
                key={item._id}
                item={item}
                onClaim={() =>
                  setClaimItem(item)
                }
              />

            ))}

          </div>

          {!filteredItems.length && (

            <div className="empty-card">

              <div>🔍</div>

              <h3>
                No matching items
              </h3>

              <p>
                Try a different search term.
              </p>

            </div>

          )}

        </section>
      )}

      {/* ADMIN */}
      {view === "admin" && (

        <section className="page">

          {!adminLoggedIn ? (

            <div className="auth-card">

              <div className="auth-side">

                <span>LF</span>

                <h2>
                  Campus Admin
                </h2>

                <p>
                  Manage reports and keep the
                  campus return process organized.
                </p>

              </div>

              <form
                className="auth-form"
                onSubmit={
                  adminMode === "login"
                    ? loginAdmin
                    : setupAdmin
                }
              >

                <div className="auth-tabs">

                  <button
                    type="button"
                    className={
                      adminMode === "login"
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setAdminMode("login")
                    }
                  >
                    Login
                  </button>

                  <button
                    type="button"
                    className={
                      adminMode === "setup"
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setAdminMode("setup")
                    }
                  >
                    Create Account
                  </button>

                </div>

                <span className="eyebrow">
                  ADMIN ACCESS
                </span>

                <h1>
                  {adminMode === "login"
                    ? "Welcome back"
                    : "Create admin account"}
                </h1>

                {adminMode === "setup" && (

                  <Field label="Name">

                    <input
                      name="name"
                      value={adminForm.name}
                      onChange={handleAdminChange}
                      required
                    />

                  </Field>

                )}

                <Field label="Username">

                  <input
                    name="username"
                    value={adminForm.username}
                    onChange={handleAdminChange}
                    required
                  />

                </Field>

                <Field label="Password">

                  <input
                    type="password"
                    name="password"
                    value={adminForm.password}
                    onChange={handleAdminChange}
                    required
                  />

                </Field>

                <button
                  className="primary-btn full"
                  type="submit"
                >
                  {adminMode === "login"
                    ? "Login to Dashboard →"
                    : "Create Admin Account →"}
                </button>

              </form>

            </div>

          ) : (

            <>

              {/* ADMIN HEADER */}

              <div className="admin-head">

                <div>

                  <span className="eyebrow">
                    ADMIN DASHBOARD
                  </span>

                  <h1>
                    Good to see you,{" "}
                    {localStorage.getItem(
                      "adminName"
                    ) || "Admin"}.
                  </h1>

                  <p>
                    Review reports and manage
                    student claims.
                  </p>

                </div>

                <button
                  className="secondary-btn"
                  onClick={logoutAdmin}
                >
                  Logout
                </button>

              </div>

              {/* ADMIN STATS */}

              <div className="admin-grid">

                <div>
                  <span>Total Reports</span>
                  <strong>{items.length}</strong>
                </div>

                <div>
                  <span>Lost</span>
                  <strong>{lostCount}</strong>
                </div>

                <div>
                  <span>Found</span>
                  <strong>{foundCount}</strong>
                </div>

                <div>
                  <span>Total Claims</span>
                  <strong>{claims.length}</strong>
                </div>

              </div>

              {/* ITEM REPORTS */}

              <div className="admin-table">

                <div style={{ padding: "24px" }}>

                  <span className="eyebrow">
                    ITEM REPORTS
                  </span>

                  <h2>
                    Campus Reports
                  </h2>

                </div>

                {items.length === 0 ? (

                  <div className="empty-card">

                    <div>📦</div>

                    <h3>
                      No reports yet
                    </h3>

                  </div>

                ) : (

                  items.map((item) => (

                    <div
                      className="admin-row"
                      key={item._id}
                    >

                      <div className="admin-item">

                        <div className="admin-thumb">

                          {item.image ? (

                            <img
                              src={item.image}
                              alt=""
                            />

                          ) : (

                            <span>📦</span>

                          )}

                        </div>

                        <div>

                          <strong>
                            {item.title}
                          </strong>

                          <small>
                            {item.type} •{" "}
                            {item.category} •{" "}
                            {item.location}
                          </small>

                        </div>

                      </div>

                      <span
                        className={
                          item.type === "Lost"
                            ? "badge lost"
                            : "badge found"
                        }
                      >
                        {item.type}
                      </span>

                      <span className="status">
                        {item.status}
                      </span>

                    </div>

                  ))

                )}

              </div>

              {/* CLAIM MANAGEMENT */}

              <div
                className="admin-table"
                style={{ marginTop: "30px" }}
              >

                <div style={{ padding: "24px" }}>

                  <span className="eyebrow">
                    CLAIM MANAGEMENT
                  </span>

                  <h2>
                    Student Claims
                  </h2>

                  <p>
                    Review ownership requests and
                    update claim status.
                  </p>

                </div>

                {claims.length === 0 ? (

                  <div className="empty-card">

                    <div>📋</div>

                    <h3>
                      No claims yet
                    </h3>

                    <p>
                      Claims submitted by students
                      will appear here.
                    </p>

                  </div>

                ) : (

                  claims.map((claim) => (

                    <div
                      className="admin-row"
                      key={claim._id}
                      style={{
                        display: "block",
                        padding: "22px",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "20px",
                          flexWrap: "wrap",
                        }}
                      >

                        <div className="admin-item">

                          <div className="admin-thumb">

                            {claim.itemId?.image ? (

                              <img
                                src={claim.itemId.image}
                                alt=""
                              />

                            ) : (

                              <span>📦</span>

                            )}

                          </div>

                          <div>

                            <strong>
                              {claim.itemId?.title ||
                                "Unknown Item"}
                            </strong>

                            <small>
                              {claim.itemId?.category ||
                                "Item"}{" "}
                              •{" "}
                              {claim.itemId?.location ||
                                "Unknown location"}
                            </small>

                          </div>

                        </div>

                        <span className="status">
                          {claim.status}
                        </span>

                      </div>

                      <div style={{ marginTop: "18px" }}>

                        <p>
                          <strong>
                            Enrollment:
                          </strong>{" "}
                          {claim.enrollmentNo}
                        </p>

                        <p>
                          <strong>
                            Department:
                          </strong>{" "}
                          {claim.department}
                        </p>

                        <p>
                          <strong>
                            Ownership Proof:
                          </strong>{" "}
                          {claim.reason}
                        </p>

                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "10px",
                          flexWrap: "wrap",
                          marginTop: "18px",
                        }}
                      >

                        {claim.status ===
                          "Under Review" && (
                          <>

                            <button
                              className="primary-btn"
                              disabled={claimLoading}
                              onClick={() =>
                                updateClaimStatus(
                                  claim._id,
                                  "Approved"
                                )
                              }
                            >
                              ✓ Approve
                            </button>

                            <button
                              className="secondary-btn"
                              disabled={claimLoading}
                              onClick={() =>
                                updateClaimStatus(
                                  claim._id,
                                  "Rejected"
                                )
                              }
                            >
                              ✕ Reject
                            </button>

                          </>
                        )}

                        {claim.status ===
                          "Approved" && (

                          <button
                            className="primary-btn"
                            disabled={claimLoading}
                            onClick={() =>
                              updateClaimStatus(
                                claim._id,
                                "Handed Over"
                              )
                            }
                          >
                            🤝 Mark as Handed Over
                          </button>

                        )}

                        {claim.status ===
                          "Rejected" && (

                          <span className="status">
                            Claim rejected
                          </span>

                        )}

                        {claim.status ===
                          "Handed Over" && (

                          <span className="status">
                            ✓ Item handed over successfully
                          </span>

                        )}

                      </div>

                    </div>

                  ))

                )}

              </div>

            </>

          )}

        </section>

      )}

      {/* FOOTER */}

      <footer>

        <div>

          <strong>
            Campus Lost & Found
          </strong>

          <p>
            A simple digital space for
            returning belongings.
          </p>

        </div>

        <span>
          © 2026 Campus Claim Management System
        </span>

      </footer>

      {/* CLAIM MODAL */}

      {claimItem && (

        <div
          className="modal-backdrop"
          onClick={() => setClaimItem(null)}
        >

          <form
            className="claim-modal"
            onSubmit={submitClaim}
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="close"
              type="button"
              onClick={() =>
                setClaimItem(null)
              }
            >
              ×
            </button>

            <span className="eyebrow">
              OWNERSHIP CLAIM
            </span>

            <h2>
              Claim {claimItem.title}
            </h2>

            <p>
              Provide details that help the
              admin verify that this item belongs
              to you.
            </p>

            <Field label="Enrollment Number">

              <input
                value={claimForm.enrollmentNo}
                onChange={(e) =>
                  setClaimForm({
                    ...claimForm,
                    enrollmentNo:
                      e.target.value,
                  })
                }
                required
              />

            </Field>

            <Field label="Department">

              <input
                value={claimForm.department}
                onChange={(e) =>
                  setClaimForm({
                    ...claimForm,
                    department:
                      e.target.value,
                  })
                }
                required
              />

            </Field>

            <Field label="Why is this yours?">

              <textarea
                value={claimForm.reason}
                onChange={(e) =>
                  setClaimForm({
                    ...claimForm,
                    reason: e.target.value,
                  })
                }
                placeholder="Mention identifying details or proof..."
                required
              />

            </Field>

            <button
              className="primary-btn full"
              type="submit"
            >
              Submit Claim →
            </button>

          </form>

        </div>

      )}

    </div>
  );
}

// ===============================
// ITEM CARD
// ===============================

function ItemCard({ item, onClaim }) {
  const unavailable = [
    "Claim Under Review",
    "Claim Approved",
    "Handed Over",
  ].includes(item.status);

  return (
    <article className="item-card">

      <div className="item-image">

        {item.image ? (

          <img
            src={item.image}
            alt={item.title}
          />

        ) : (

          <div className="image-placeholder">

            <span>📦</span>

            <small>
              No image
            </small>

          </div>

        )}

        <div className="image-badges">

          <span
            className={
              item.type === "Lost"
                ? "badge lost"
                : "badge found"
            }
          >
            {item.type}
          </span>

          <span className="status">
            {item.status}
          </span>

        </div>

      </div>

      <div className="item-body">

        <span className="category">
          {item.category}
        </span>

        <h3>
          {item.title}
        </h3>

        <p className="description">
          {item.description ||
            "No description provided."}
        </p>

        <div className="item-meta">

          <span>
            📍 {item.location}
          </span>

          <span>
            📅 {item.date}
          </span>

        </div>

        <div className="contact-box">

          <div className="avatar">
            {(item.contactName || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>

            <small>
              CONTACT
            </small>

            <strong>
              {item.contactName ||
                "Not provided"}
            </strong>

            <a
              href={
                item.contactNumber
                  ? `tel:${item.contactNumber}`
                  : undefined
              }
            >
              📞{" "}
              {item.contactNumber ||
                "Not provided"}
            </a>

          </div>

        </div>

        <button
          className="claim-btn"
          onClick={onClaim}
          disabled={unavailable}
        >
          {item.status === "Handed Over"
            ? "Already Handed Over"
            : item.status === "Claim Approved"
            ? "Claim Approved"
            : item.status === "Claim Under Review"
            ? "Claim Under Review"
            : "Claim This Item"}

          <span>→</span>
        </button>

      </div>

    </article>
  );
}

// ===============================
// FIELD
// ===============================

function Field({ label, children }) {
  return (
    <label className="field">

      <span>{label}</span>

      {children}

    </label>
  );
}

export default App;