"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Edit,
  Eye,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { adminApi } from "../../../lib/api";

type Banner = {
  _id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
};

type BannerForm = {
  title: string;
  subtitle: string;
  ctaText: string;
  isActive: boolean;
  image: File | null;
};

const initialForm: BannerForm = {
  title: "",
  subtitle: "",
  ctaText: "",
  isActive: true,
  image: null,
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] =
    useState<Banner | null>(null);

  const [form, setForm] =
    useState<BannerForm>(initialForm);

  const [saving, setSaving] = useState(false);
  const [preview, setPreview] =
    useState<string | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      setLoading(true);

      const response = await adminApi.banners();

      setBanners(response?.banners || []);
    } catch (error: any) {
      alert(
        error?.message ||
          "Failed to load banners"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadBanners();
  }

  function openAdd() {
    setEditingBanner(null);
    setForm(initialForm);
    setPreview(null);
    setShowForm(true);
  }

  function openEdit(banner: Banner) {
    setEditingBanner(banner);

    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      ctaText: banner.ctaText || "",
      isActive: banner.isActive,
      image: null,
    });

    setPreview(banner.imageUrl || null);
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingBanner(null);
    setForm(initialForm);
    setPreview(null);
  }

  function handleInput(
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleImage(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0] || null;

    setForm((prev) => ({
      ...prev,
      image: file,
    }));

    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!editingBanner && !form.image) {
      alert("Please select banner image.");
      return;
    }

    try {
      setSaving(true);

      if (editingBanner) {
        await adminApi.updateBanner(
          editingBanner._id,
          {
            image: form.image || undefined,
            title: form.title.trim(),
            subtitle: form.subtitle.trim(),
            ctaText: form.ctaText.trim(),
            isActive: form.isActive,
          }
        );
      } else {
        await adminApi.createBanner({
          image: form.image!,
          title: form.title.trim(),
          subtitle: form.subtitle.trim(),
          ctaText: form.ctaText.trim(),
          isActive: form.isActive,
        });
      }

      closeForm();

      await loadBanners();

     
    } catch (error: any) {
      alert(
        error?.message ||
          "Failed to save banner."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleBanner(banner: Banner) {
    try {
      await adminApi.toggleBanner(banner._id);

      await loadBanners();
    } catch (error: any) {
      alert(
        error?.message ||
          "Failed to update banner status."
      );
    }
  }

  async function deleteBanner(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this banner?"
    );

    if (!confirmed) return;

    try {
      await adminApi.deleteBanner(id);

      await loadBanners();
    } catch (error: any) {
      alert(
        error?.message ||
          "Failed to delete banner."
      );
    }
  }

  const filteredBanners = banners.filter(
    (banner) => {
      const query = search.toLowerCase();

      const matchesSearch =
        !query ||
        banner.title
          ?.toLowerCase()
          .includes(query) ||
        banner.subtitle
          ?.toLowerCase()
          .includes(query) ||
        banner.ctaText
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        status === "all" ||
        (status === "active" &&
          banner.isActive) ||
        (status === "inactive" &&
          !banner.isActive);

      return (
        matchesSearch &&
        matchesStatus
      );
    }
  );

  return (
    <div className="page">
      {/* ================= HEADER ================= */}

      <div className="head">
        <div>
          <h1 className="title">
            Banners
          </h1>

          <p className="sub">
            Manage homepage banners and slider
            content.
          </p>
        </div>

        <div className="actions">
          <button
            className="btn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              size={16}
              className={
                refreshing ? "spin" : ""
              }
            />

            Refresh
          </button>

          <button
            className="btn primary"
            onClick={openAdd}
          >
            <Plus size={17} />

            Add Banner
          </button>
        </div>
      </div>

      {/* ================= FILTERS ================= */}

      <div className="filters">
        <div className="searchWrap">
          <Search
            size={17}
            className="searchIcon"
            aria-hidden="true"
          />

          <input
            className="input"
            placeholder="Search banners..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <select
          className="select"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value)
          }
        >
          <option value="all">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>
      </div>

      {/* ================= TABLE ================= */}

      <div className="card">
        <div className="cardhead">
          <div>
            <h2>Banner List</h2>

            <p>
              {filteredBanners.length} banner
              {filteredBanners.length !== 1
                ? "s"
                : ""}
            </p>
          </div>

          <div className="sectionIcon">
            <ImageIcon size={18} />
          </div>
        </div>

        {loading ? (
          <div className="loading">
            Loading banners...
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="empty">
            <ImageIcon size={35} />

            <h3>
              No banners found
            </h3>

            <p>
              Add your first banner to
              display it in the app.
            </p>

            <button
              className="btn primary"
              onClick={openAdd}
            >
              <Plus size={16} />

              Add Banner
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Banner</th>
                <th>CTA</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredBanners.map(
                (banner) => (
                  <tr key={banner._id}>
                    {/* IMAGE */}

                    <td>
                      <div className="bannerThumb">
                        <img
                          src={banner.imageUrl}
                          alt={
                            banner.title ||
                            "Banner"
                          }
                        />
                      </div>
                    </td>

                    {/* BANNER */}

                    <td>
                      <div className="bannerInfo">
                        <strong>
                          {banner.title ||
                            "Untitled Banner"}
                        </strong>

                        {banner.subtitle && (
                          <span>
                            {banner.subtitle}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* CTA */}

                    <td>
                      {banner.ctaText ? (
                        <span className="badge">
                          {banner.ctaText}
                        </span>
                      ) : (
                        <span className="muted">
                          No CTA
                        </span>
                      )}
                    </td>

                    {/* STATUS */}

                    <td>
                      <button
                        className={`statusBtn ${
                          banner.isActive
                            ? "statusActive"
                            : "statusInactive"
                        }`}
                        onClick={() =>
                          toggleBanner(
                            banner
                          )
                        }
                      >
                        {banner.isActive
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>

                    {/* ACTIONS */}

                    <td>
                      <div className="rowActions">
                        <button
                          className="iconBtn"
                          title="Preview"
                          onClick={() =>
                            setPreview(
                              banner.imageUrl
                            )
                          }
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          className="iconBtn"
                          title="Edit"
                          onClick={() =>
                            openEdit(
                              banner
                            )
                          }
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          className="iconBtn danger"
                          title="Delete"
                          onClick={() =>
                            deleteBanner(
                              banner._id
                            )
                          }
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= ADD / EDIT MODAL ================= */}

      {showForm && (
        <div className="modalOverlay">
          <div className="modal bannerModal">
            <div className="modalHead">
              <div>
                <h2>
                  {editingBanner
                    ? "Edit Banner"
                    : "Add Banner"}
                </h2>

                <p>
                  {editingBanner
                    ? "Update banner details."
                    : "Create a new homepage banner."}
                </p>
              </div>

              <button
                className="closeBtn"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div className="bannerFormGrid">
                {/* IMAGE */}

                <div className="bannerImageColumn">
                  <label className="label">
                    Banner Image
                  </label>

                  <label className="imageUpload">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                      />
                    ) : (
                      <div className="uploadPlaceholder">
                        <ImageIcon
                          size={32}
                        />

                        <strong>
                          Upload Banner
                        </strong>

                        <span>
                          JPG, PNG or WEBP
                          · Max 5MB
                        </span>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={
                        handleImage
                      }
                      hidden
                    />
                  </label>
                </div>

                {/* FIELDS */}

                <div className="bannerFields">
                  {/* TITLE */}

                  <div className="group">
                    <label className="label">
                      Title
                    </label>

                    <input
                      className="input"
                      name="title"
                      value={form.title}
                      onChange={
                        handleInput
                      }
                      placeholder="Enter banner title"
                    />
                  </div>

                  {/* SUBTITLE */}

                  <div className="group">
                    <label className="label">
                      Subtitle
                    </label>

                    <textarea
                      className="input textarea"
                      name="subtitle"
                      value={
                        form.subtitle
                      }
                      onChange={
                        handleInput
                      }
                      placeholder="Enter banner subtitle"
                      rows={3}
                    />
                  </div>

                  {/* CTA */}

                  <div className="group">
                    <label className="label">
                      CTA Text
                    </label>

                    <input
                      className="input"
                      name="ctaText"
                      value={
                        form.ctaText
                      }
                      onChange={
                        handleInput
                      }
                      placeholder="Get Started"
                    />
                  </div>

                  {/* STATUS */}

                  <div className="group">
                    <label className="label">
                      Status
                    </label>

                    <label className="switchRow">
                      <input
                        type="checkbox"
                        checked={
                          form.isActive
                        }
                        onChange={(e) =>
                          setForm(
                            (prev) => ({
                              ...prev,
                              isActive:
                                e.target
                                  .checked,
                            })
                          )
                        }
                      />

                      <span>
                        {form.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="formActions">
                <button
                  type="button"
                  className="btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingBanner
                    ? "Update Banner"
                    : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PREVIEW ================= */}

      {preview && !showForm && (
        <div
          className="modalOverlay"
          onClick={() =>
            setPreview(null)
          }
        >
          <div
            className="previewModal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="closeBtn previewClose"
              onClick={() =>
                setPreview(null)
              }
            >
              <X size={20} />
            </button>

            <img
              src={preview}
              alt="Banner preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}