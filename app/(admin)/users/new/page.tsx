"use client";

import {
  FormEvent,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  UserPlus,
} from "lucide-react";
import { adminApi } from "../../../../lib/api";

type FormState = {
  name: string;
  email: string;
  phone: string;
  status: string;
};

export default function NewUser() {
  const router = useRouter();

  const [form, setForm] =
    useState<FormState>({
      name: "",
      email: "",
      phone: "",
      status: "active",
    });

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const updateField = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (error) {
      setError("");
    }
  };

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    const name =
      form.name.trim();

    const email =
      form.email.trim();

    const phone =
      form.phone.trim();

    if (!name) {
      setError(
        "Please enter the customer's name."
      );
      return;
    }

    if (!phone) {
      setError(
        "Please enter the customer's phone number."
      );
      return;
    }

    if (email) {
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        setError(
          "Please enter a valid email address."
        );
        return;
      }
    }

    try {
      setLoading(true);
      setError("");

      const response: any =
        await adminApi.createUser({
          name,
          email,
          phone,
          status: form.status,
        });

      if (!response?.user?._id) {
        throw new Error(
          "User was created, but the user ID was not returned."
        );
      }

      router.replace(
        `/users/${response.user._id}`
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Unable to create user. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="head">
        <div>
          <Link
            href="/users"
            className="backLink"
          >
            <ArrowLeft size={15} />
            Back to users
          </Link>

          <h1 className="title">
            Create User
          </h1>

          <p className="sub">
            Add a customer manually.
          </p>
        </div>
      </div>

      {/* Form */}
      <section className="card createUserCard">
        <div className="cardhead">
          <div>
            <strong>
              Customer Information
            </strong>

            <p className="sub">
              Enter the basic details for the
              new customer.
            </p>
          </div>

          <div className="formIcon">
            <UserPlus size={19} />
          </div>
        </div>

        <form
          className="body"
          onSubmit={handleSubmit}
        >
          {error && (
            <div
              className="error"
              role="alert"
            >
              <div>
                <strong>
                  Unable to create user
                </strong>

                <div>{error}</div>
              </div>
            </div>
          )}

          <div className="formGrid">
            {/* Name */}
            <div className="group">
              <label
                className="label"
                htmlFor="user-name"
              >
                Full Name
                <span className="required">
                  *
                </span>
              </label>

              <input
                id="user-name"
                className="input"
                type="text"
                name="name"
                placeholder="Enter full name"
                autoComplete="name"
                required
                value={form.name}
                onChange={(event) =>
                  updateField(
                    "name",
                    event.target.value
                  )
                }
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div className="group">
              <label
                className="label"
                htmlFor="user-phone"
              >
                Phone Number
                <span className="required">
                  *
                </span>
              </label>

              <input
                id="user-phone"
                className="input"
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                autoComplete="tel"
                required
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value
                  )
                }
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div className="group">
              <label
                className="label"
                htmlFor="user-email"
              >
                Email
                <span className="optional">
                  Optional
                </span>
              </label>

              <input
                id="user-email"
                className="input"
                type="email"
                name="email"
                placeholder="customer@example.com"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value
                  )
                }
                disabled={loading}
              />
            </div>

            {/* Status */}
            <div className="group">
              <label
                className="label"
                htmlFor="user-status"
              >
                Account Status
              </label>

              <select
                id="user-status"
                className="select"
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value
                  )
                }
                disabled={loading}
              >
                <option value="active">
                  Active
                </option>

                <option value="inactive">
                  Inactive
                </option>

                <option value="blocked">
                  Blocked
                </option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="formActions">
            <Link
              href="/users"
              className="btn"
              aria-disabled={loading}
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="btn primary"
              disabled={
                loading ||
                !form.name.trim() ||
                !form.phone.trim()
              }
            >
              {loading ? (
                <>
                  <span className="loader" />
                  Creating...
                </>
              ) : (
                <>
                  <Check size={15} />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}