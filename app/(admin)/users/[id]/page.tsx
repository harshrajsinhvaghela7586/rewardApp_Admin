"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Gift,
  RefreshCw,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { useParams } from "next/navigation";
import { adminApi } from "../../../../lib/api";

const MAX_POLICY_SIZE =
  10 * 1024 * 1024;

type LoadingAction =
  | "page"
  | "upload"
  | "delete"
  | "reward"
  | "";

export default function UserDetail() {
  const params =
    useParams<{ id: string }>();

  const id = params?.id;

  const [data, setData] =
    useState<any>(null);

  const [error, setError] =
    useState("");

  const [action, setAction] =
    useState<LoadingAction>("page");

  const [reward, setReward] = useState("");

  const load = useCallback(
    async (
      showLoader = true
    ) => {
      if (!id) return;

      try {
        if (showLoader) {
          setAction("page");
        }

        setError("");

        const response =
          await adminApi.user(id);

        setData(response);
      } catch (err: any) {
        setError(
          err?.message ||
          "Unable to load user details."
        );
      } finally {
        if (showLoader) {
          setAction("");
        }
      }
    },
    [id]
  );

  useEffect(() => {
    load();
  }, [load]);

  /*
   * Upload policy PDF.
   */
  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file || !id) {
      return;
    }

    try {
      setError("");

      /*
       * Validate MIME type.
       */
      if (
        file.type !==
        "application/pdf"
      ) {
        throw new Error(
          "Only PDF files are allowed."
        );
      }

      /*
       * Validate file size.
       */
      if (
        file.size >
        MAX_POLICY_SIZE
      ) {
        throw new Error(
          "Policy PDF must be smaller than 10 MB."
        );
      }

      setAction("upload");

      await adminApi.uploadPolicy(
        id,
        file
      );

      await load(false);
    } catch (err: any) {
      setError(
        err?.message ||
        "Unable to upload policy."
      );
    } finally {
      setAction("");

      /*
       * Allows the same file to be
       * selected again.
       */
      event.target.value = "";
    }
  }

  /*
   * Delete policy.
   */
  async function handleDeletePolicy() {
    if (!id) return;

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this policy?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setAction("delete");

      await adminApi.deletePolicy(
        id
      );

      await load(false);
    } catch (err: any) {
      setError(
        err?.message ||
        "Unable to delete policy."
      );
    } finally {
      setAction("");
    }
  }

  /*
   * Issue scratch card.
   */
  async function handleIssueReward() {
    if (!id) return;

    const amount = Number(reward);

    if (
      !reward.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid reward amount."
      );
      return;
    }

    if (!Number.isInteger(amount)) {
      setError(
        "Reward amount must be a whole number."
      );
      return;
    }

    try {
      setError("");
      setAction("reward");

      await adminApi.issue(
        id,
        amount
      );

      await load(false);

      setReward("");
    } catch (err: any) {
      setError(
        err?.message ||
        "Unable to issue reward."
      );
    } finally {
      setAction("");
    }
  }

  if (action === "page" && !data) {
    return (
      <div className="page">
        <div className="loadingBox">
          <span className="loader loaderLarge" />
          <span>
            Loading user details...
          </span>
        </div>
      </div>
    );
  }

  const user =
    data?.user;

  const policy =
    data?.policy;

  const scratchCards =
    data?.scratchCards || [];

  /*
   * If user wasn't returned by backend.
   */
  if (!user && !error) {
    return (
      <div className="page">
        <div className="emptyState">
          User not found.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="head userDetailHead">
        <div>
          <Link
            href="/users"
            className="backLink"
          >
            <ArrowLeft size={15} />
            Back to users
          </Link>

          <div className="userTitleRow">
            <div className="userAvatar">
              <UserRound size={21} />
            </div>

            <div>
              <h1 className="title">
                {user?.name ||
                  "User"}
              </h1>

              <p className="sub userMeta">
                {user?.phone ||
                  "No phone"}

                <span>•</span>

                {user?.email ||
                  "No email"}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() =>
            load()
          }
          disabled={
            action !== ""
          }
        >
          <RefreshCw
            size={15}
            className={
              action === "page"
                ? "spin"
                : ""
            }
          />

          <span>
            {action === "page"
              ? "Refreshing..."
              : "Refresh"}
          </span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="error"
          role="alert"
        >
          <div>
            <strong>
              Something went wrong
            </strong>

            <div>{error}</div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() =>
              load()
            }
          >
            Try Again
          </button>
        </div>
      )}

      {/* Personal + Nominee */}
      <div className="grid2">
        <section className="card">
          <div className="cardhead">
            <div>
              <strong>
                Personal & Vehicle
              </strong>

              <p className="sub">
                Customer account
                information.
              </p>
            </div>
          </div>

          <div className="body details">
            <Detail
              label="Name"
              value={user?.name}
            />

            <Detail
              label="Phone"
              value={user?.phone}
            />

            <Detail
              label="Email"
              value={user?.email}
            />

            <Detail
              label="Date of Birth"
              value={
                user?.dob
                  ? new Date(
                    user.dob
                  ).toLocaleDateString()
                  : "-"
              }
            />

           
            <Detail
              label="Status"
              value={
                <StatusBadge
                  status={
                    user?.status
                  }
                />
              }
            />

            <Detail
              label="Verification"
              value={
                <StatusBadge
                  status={
                    user?.isVerified
                      ? "Verified"
                      : "Not Verified"
                  }
                />
              }
            />

            <Detail
              label="Account Type"
              value={
                user?.isGuest
                  ? "Guest"
                  : "Registered"
              }
            />
          </div>
        </section>

        <section className="card">
          <div className="cardhead">
            <div>
              <strong>
                Nominee
              </strong>

              <p className="sub">
                Registered nominee
                information.
              </p>
            </div>
          </div>

          <div className="body details">
            <Detail
              label="Name"
              value={
                user?.nomineeName
              }
            />

            <Detail
              label="Relationship"
              value={
                user?.nomineeRelationship
              }
            />

            <Detail
              label="Date of Birth"
              value={
                user?.nomineeDob
              }
            />

            <Detail
              label="Mobile"
              value={
                user?.nomineeMobile
              }
            />
          </div>
        </section>
      </div>

      {/* Documents */}
      {/* Documents */}
<section className="card sectionGap">
  <div className="cardhead">
    <div>
      <strong>
        Documents
      </strong>

      <p className="sub">
        Customer verification
        documents.
      </p>
    </div>
  </div>

  <div className="body docs">
    <DocumentRow
      label="RC"
      url={user?.rcFileUrl}
    />

    <DocumentRow
      label="Previous Policy"
      url={
        user?.previousPolicyUrl
      }
    />

    <DocumentRow
      label="Aadhaar Front"
      url={
        user?.aadhaarFrontUrl
      }
    />

    <DocumentRow
      label="Aadhaar Back"
      url={
        user?.aadhaarBackUrl
      }
    />

    <DocumentRow
      label="PAN"
      url={user?.panUrl}
    />
  </div>
</section>

      {/* Policy */}
      <section className="card sectionGap">
        <div className="cardhead">
          <div>
            <strong>
              Policy
            </strong>

            <p className="sub">
              Upload or manage the
              customer's policy.
            </p>
          </div>

          <label
            className={`btn primary ${action === "upload"
                ? "uploadBusy"
                : ""
              }`}
          >
            {action === "upload" ? (
              <span className="loader" />
            ) : (
              <Upload size={15} />
            )}

            <span>
              {action === "upload"
                ? "Uploading..."
                : "Upload PDF"}
            </span>

            <input
              hidden
              type="file"
              accept="application/pdf,.pdf"
              onChange={
                handleUpload
              }
              disabled={
                action !== ""
              }
            />
          </label>
        </div>

        <div className="body">
          {policy ? (
            <div className="policyRow">
              <div className="policyInfo">
                <div className="policyIcon">
                  <FileText
                    size={19}
                  />
                </div>

                <div className="policyText">
                  <strong>
                    {policy.policyFileName ||
                      policy.policyNumber ||
                      "Policy Document"}
                  </strong>

                  <span>
                    {policy.policyNumber ||
                      "No policy number"}
                  </span>
                </div>
              </div>

              <div className="actions">
                {policy.policyFileUrl && (
                  <a
                    className="btn"
                    href={
                      policy.policyFileUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink
                      size={15}
                    />

                    <span>
                      View
                    </span>
                  </a>
                )}

                <button
                  type="button"
                  className="btn danger"
                  onClick={
                    handleDeletePolicy
                  }
                  disabled={
                    action !== ""
                  }
                >
                  {action ===
                    "delete" ? (
                    <span className="loader" />
                  ) : (
                    <Trash2
                      size={15}
                    />
                  )}

                  <span>
                    {action ===
                      "delete"
                      ? "Deleting..."
                      : "Delete"}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="empty">
              <FileText
                size={25}
              />

              <strong>
                No policy uploaded
              </strong>

              <span>
                Upload a PDF policy
                document to attach it
                to this customer.
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Rewards */}
      {/* Rewards */}
      <section className="card sectionGap">
        <div className="cardhead rewardHeader">
          <div>
            <strong>
              Rewards / Scratch Cards
            </strong>

            <p className="sub">
              Issue and track customer
              rewards.
            </p>
          </div>

          <div className="rewardControls">

            <div className="rewardInputWrapper">
              <span className="rewardCurrency">
                ₹
              </span>

              <input
                type="number"
                className="input rewardInput"
                value={reward}
                onChange={(event) =>
                  setReward(event.target.value)
                }
                placeholder="Enter amount"
                min="1"
                step="1"
                disabled={action !== ""}
                aria-label="Reward amount"
              />
            </div>

            <button
              type="button"
              className="btn primary"
              onClick={handleIssueReward}
              disabled={action !== ""}
            >
              {action === "reward" ? (
                <span className="loader" />
              ) : (
                <Gift size={15} />
              )}

              <span>
                {action === "reward"
                  ? "Issuing..."
                  : "Issue Reward"}
              </span>
            </button>

          </div>
        </div>

        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Status</th>
                <th>Issued</th>
                <th>Scratched</th>
              </tr>
            </thead>

            <tbody>
              {scratchCards.map(
                (card: any) => (
                  <tr
                    key={card._id}
                  >
                    <td>
                      <strong>
                        ₹
                        {Number(
                          card.amount || 0
                        ).toLocaleString()}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`badge ${card.isScratched
                            ? "ok"
                            : "warn"
                          }`}
                      >
                        {card.isScratched
                          ? "Scratched"
                          : "Available"}
                      </span>
                    </td>

                    <td>
                      {card.createdAt
                        ? new Date(
                          card.createdAt
                        ).toLocaleString()
                        : "-"}
                    </td>

                    <td>
                      {card.scratchedAt
                        ? new Date(
                          card.scratchedAt
                        ).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                )
              )}

              {!scratchCards.length && (
                <tr>
                  <td colSpan={4}>
                    <div className="empty">
                      <Gift size={24} />

                      <strong>
                        No rewards issued
                      </strong>

                      <span>
                        Issue a reward to
                        see it here.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


/* =========================================
   DETAIL FIELD
========================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="detail">
      <small>{label}</small>

      <b className="detailValue">
        {value || "-"}
      </b>
    </div>
  );
}


/* =========================================
   STATUS BADGE
========================================= */

function StatusBadge({
  status,
}: {
  status?: string;
}) {
  if (!status) {
    return (
      <span className="badge neutral">
        -
      </span>
    );
  }

  const normalized =
    status.toLowerCase();

  const type =
    normalized === "active" ||
      normalized === "verified"
      ? "ok"
      : normalized ===
        "blocked" ||
        normalized ===
        "expired"
        ? "bad"
        : normalized ===
          "inactive" ||
          normalized ===
          "not verified"
          ? "warn"
          : "neutral";

  return (
    <span
      className={`badge ${type}`}
    >
      {status}
    </span>
  );
}


/* =========================================
   DOCUMENT
========================================= */

function DocumentRow({
  label,
  url,
}: {
  label: string;
  url?: string;
}) {
  return (
    <div className="doc">
      <div className="docInfo">
        <div className="docIcon">
          <FileText size={17} />
        </div>

        <div>
          <b>{label}</b>

          <div className="sub">
            {url
              ? "Document uploaded"
              : "Not uploaded"}
          </div>
        </div>
      </div>

      {url ? (
        <a
          className="btn"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink
            size={15}
          />

          <span>View</span>
        </a>
      ) : (
        <span className="badge neutral">
          Missing
        </span>
      )}
    </div>
  );
}