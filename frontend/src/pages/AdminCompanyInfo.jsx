// src/pages/AdminCompanyInfo.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import api from "../utils/api";
import AdminNavbar from "../Navbar/AdminNavbar";
import { useAuth } from "./AuthContext";
import "../Css/AdminCompanyInfo.css";

const emptyForm = {
  name: "",
  founder: "",
  units: [""],
  address_street: "",
  address_city: "",
  address_state: "",
  phones: [""],
  emails: [""],
  website: "",
  tagline: "",
  description: "",
  facebook: "",
  instagram: "",
  twitter: "",
  investors: [""],
  business_partners: [""],
  international_partners: [""],
};

/* ─── Reusable array editor (OUTSIDE the component) ─── */
function ArrayEditor({
  field,
  label,
  placeholder,
  icon,
  items,
  onUpdate,
  onAdd,
  onRemove,
}) {
  return (
    <div className="aci-field aci-array-field">
      <label>
        {icon} {label}
      </label>
      <div className="aci-array-list">
        {items.map((val, idx) => (
          <div className="aci-array-row" key={idx}>
            <input
              type="text"
              value={val}
              placeholder={placeholder}
              onChange={(e) => onUpdate(field, idx, e.target.value)}
            />
            <button
              type="button"
              className="aci-array-remove"
              onClick={() => onRemove(field, idx)}
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="aci-array-add"
        onClick={() => onAdd(field)}
      >
        ➕ Add item
      </button>
    </div>
  );
}

const AdminCompanyInfo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && !user.is_admin) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/company-info");
        setForm({
          name: data.name || "",
          founder: data.founder || "",
          units:
            Array.isArray(data.units) && data.units.length
              ? data.units
              : [""],
          address_street: data.address_street || "",
          address_city: data.address_city || "",
          address_state: data.address_state || "",
          phones:
            Array.isArray(data.phones) && data.phones.length
              ? data.phones
              : [""],
          emails:
            Array.isArray(data.emails) && data.emails.length
              ? data.emails
              : [""],
          website: data.website || "",
          tagline: data.tagline || "",
          description: data.description || "",
          facebook: data.facebook || "",
          instagram: data.instagram || "",
          twitter: data.twitter || "",
          investors:
            Array.isArray(data.investors) && data.investors.length
              ? data.investors
              : [""],
          business_partners:
            Array.isArray(data.business_partners) &&
            data.business_partners.length
              ? data.business_partners
              : [""],
          international_partners:
            Array.isArray(data.international_partners) &&
            data.international_partners.length
              ? data.international_partners
              : [""],
        });
      } catch (err) {
        toast.error("Failed to load company info");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateArrayItem = (key, idx, value) => {
    setForm((f) => {
      const arr = [...f[key]];
      arr[idx] = value;
      return { ...f, [key]: arr };
    });
  };

  const addArrayItem = (key) => {
    setForm((f) => ({ ...f, [key]: [...f[key], ""] }));
  };

  const removeArrayItem = (key, idx) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].filter((_, i) => i !== idx),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      name: form.name.trim(),
      units: form.units.map((u) => u.trim()).filter(Boolean),
      phones: form.phones.map((p) => p.trim()).filter(Boolean),
      emails: form.emails.map((e) => e.trim()).filter(Boolean),
      facebook: form.facebook.trim(),
      instagram: form.instagram.trim(),
      twitter: form.twitter.trim(),
      investors: form.investors.map((x) => x.trim()).filter(Boolean),
      business_partners: form.business_partners
        .map((x) => x.trim())
        .filter(Boolean),
      international_partners: form.international_partners
        .map((x) => x.trim())
        .filter(Boolean),
    };

    try {
      await api.put("/company-info", payload);
      toast.success("Company info saved");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to save company info"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <AdminNavbar />
        <div className="aci-page">
          <div className="aci-loading">
            <div className="aci-spinner" />
            <p>Loading…</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminNavbar />
      <Toaster position="top-right" toastOptions={{ duration: 2800 }} />

      <div className="aci-page">
        <div className="aci-container">
          <header className="aci-header">
            <button
              className="aci-back"
              onClick={() => navigate(-1)}
              type="button"
            >
              ← Back
            </button>
            <div className="aci-header-main">
              <div className="aci-header-icon">🏢</div>
              <div>
                <span className="aci-badge">Admin</span>
                <h1>Company Information</h1>
                <p>Edit what appears on the Contact page</p>
              </div>
            </div>
          </header>

          <form className="aci-form" onSubmit={handleSave}>
            <section className="aci-section">
              <h2 className="aci-section-title">Basic Details</h2>

              <div className="aci-row">
                <div className="aci-field">
                  <label>🏢 Company Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    placeholder="Gokul Namkeen"
                    required
                  />
                </div>
                <div className="aci-field">
                  <label>👤 Founder / Owner</label>
                  <input
                    type="text"
                    value={form.founder}
                    onChange={(e) => set("founder", e.target.value)}
                    placeholder="Full name"
                  />
                </div>
              </div>

              <div className="aci-field">
                <label>🏷️ Tagline</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => set("tagline", e.target.value)}
                  placeholder="Authentic since 2004"
                />
              </div>

              <div className="aci-field">
                <label>📝 Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Short description about the company"
                />
              </div>
            </section>

            <section className="aci-section">
              <h2 className="aci-section-title">🏭 Manufacturing Units</h2>
              <ArrayEditor
                field="units"
                label="Unit addresses"
                placeholder="e.g. Unit 1 — Plot 12, GIDC, Surat"
                icon="📍"
                items={form.units}
                onUpdate={updateArrayItem}
                onAdd={addArrayItem}
                onRemove={removeArrayItem}
              />
            </section>

            <section className="aci-section">
              <h2 className="aci-section-title">📍 Registered Address</h2>
              <div className="aci-row">
                <div className="aci-field">
                  <label>Street</label>
                  <input
                    type="text"
                    value={form.address_street}
                    onChange={(e) => set("address_street", e.target.value)}
                    placeholder="Mota Varachha"
                  />
                </div>
                <div className="aci-field">
                  <label>City</label>
                  <input
                    type="text"
                    value={form.address_city}
                    onChange={(e) => set("address_city", e.target.value)}
                    placeholder="Surat"
                  />
                </div>
                <div className="aci-field">
                  <label>State</label>
                  <input
                    type="text"
                    value={form.address_state}
                    onChange={(e) => set("address_state", e.target.value)}
                    placeholder="Gujarat 395001"
                  />
                </div>
              </div>
            </section>

            <section className="aci-section">
              <h2 className="aci-section-title">📞 Contact</h2>

              <ArrayEditor
                field="phones"
                label="Phone numbers"
                placeholder="+91 98765 43210"
                icon="📞"
                items={form.phones}
                onUpdate={updateArrayItem}
                onAdd={addArrayItem}
                onRemove={removeArrayItem}
              />

              <ArrayEditor
                field="emails"
                label="Email addresses"
                placeholder="info@example.com"
                icon="✉️"
                items={form.emails}
                onUpdate={updateArrayItem}
                onAdd={addArrayItem}
                onRemove={removeArrayItem}
              />

              <div className="aci-field">
                <label>🌐 Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => set("website", e.target.value)}
                  placeholder="https://gokulnamkeen.com"
                />
              </div>
            </section>

            <section className="aci-section">
              <h2 className="aci-section-title">🔗 Social Links</h2>

              <div className="aci-row">
                <div className="aci-field">
                  <label>📘 Facebook</label>
                  <input
                    type="url"
                    value={form.facebook}
                    onChange={(e) => set("facebook", e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div className="aci-field">
                  <label>📸 Instagram</label>
                  <input
                    type="url"
                    value={form.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>

                <div className="aci-field">
                  <label>🐦 X (Twitter)</label>
                  <input
                    type="url"
                    value={form.twitter}
                    onChange={(e) => set("twitter", e.target.value)}
                    placeholder="https://x.com/yourhandle"
                  />
                </div>
              </div>
            </section>

            <section className="aci-section">
              <h2 className="aci-section-title">🤝 Partners</h2>

              <ArrayEditor
                field="investors"
                label="Major Investors"
                placeholder="Sequoia Capital India"
                icon="💼"
                items={form.investors}
                onUpdate={updateArrayItem}
                onAdd={addArrayItem}
                onRemove={removeArrayItem}
              />

              <ArrayEditor
                field="business_partners"
                label="Key Business Partners"
                placeholder="Reliance Retail"
                icon="🏬"
                items={form.business_partners}
                onUpdate={updateArrayItem}
                onAdd={addArrayItem}
                onRemove={removeArrayItem}
              />

              <ArrayEditor
                field="international_partners"
                label="International Partners"
                placeholder="Costco (USA)"
                icon="🌍"
                items={form.international_partners}
                onUpdate={updateArrayItem}
                onAdd={addArrayItem}
                onRemove={removeArrayItem}
              />
            </section>

            <div className="aci-actions">
              <button
                type="button"
                className="aci-btn aci-btn-secondary"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="aci-btn aci-btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="aci-btn-spinner" />
                    Saving…
                  </>
                ) : (
                  <>💾 Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AdminCompanyInfo;