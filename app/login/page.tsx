"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { adminApi } from "../../lib/api";


export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);


  async function submit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (busy) return;

    setErr("");
    setBusy(true);

    try {
      const d: any =
        await adminApi.login(
          email.trim(),
          pw
        );

      localStorage.setItem(
        "adminToken",
        d.token
      );

      localStorage.setItem(
        "adminUser",
        JSON.stringify(d.admin)
      );

      router.replace("/dashboard");
    } catch (e: any) {
      setErr(
        e?.message ||
          "Unable to sign in. Please check your credentials."
      );
    } finally {
      setBusy(false);
    }
  }


  return (
    <main className="login">
      <form
        className="loginbox"
        onSubmit={submit}
        noValidate
      >
        {/* LOGO */}
        <div className="logo">
          <ShieldCheck size={25} />
        </div>


        {/* HEADING */}
        <h1 className="loginTitle">
          Admin Login
        </h1>

        <p className="loginSubtitle">
          Manage Visezy Insurance securely.
        </p>


        {/* ERROR */}
        {err && (
          <div
            className="error"
            role="alert"
          >
            {err}
          </div>
        )}


        {/* EMAIL */}
        <div className="group">
          <label
            className="label"
            htmlFor="admin-email"
          >
            Email
          </label>

          <input
            id="admin-email"
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="admin@example.com"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);

              if (err) {
                setErr("");
              }
            }}
            disabled={busy}
          />
        </div>


        {/* PASSWORD */}
        <div className="group">
          <label
            className="label"
            htmlFor="admin-password"
          >
            Password
          </label>

          <div className="passwordWrap">
            <input
              id="admin-password"
              className="input"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);

                if (err) {
                  setErr("");
                }
              }}
              disabled={busy}
            />

            <button
              type="button"
              className="passwordToggle"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              onClick={() =>
                setShowPassword(
                  (value) => !value
                )
              }
              disabled={busy}
            >
              {showPassword ? (
                <EyeOff size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          </div>
        </div>


        {/* SUBMIT */}
       <button
  className="btn primary"
  type="submit"
  disabled={busy || !email.trim() || !pw}
  style={{
    width: "100%",
    minHeight: 44,
    padding: "11px 14px",
  }}
>
  {busy ? (
    <>
      <span
        className="loader"
        aria-hidden="true"
      />
      <span>Signing in...</span>
    </>
  ) : (
    "Sign In"
  )}
</button>


        {/* FOOTER */}
        <div className="loginFooter">
          Secure Visezy Insurance Admin Portal
        </div>
      </form>
    </main>
  );
}