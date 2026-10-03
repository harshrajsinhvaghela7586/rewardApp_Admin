"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  RefreshCw,
  Activity as ActivityIcon,
} from "lucide-react";
import { adminApi } from "../../../lib/api";

type ActivityItem = {
  _id: string;
  action?: string;
  description?: string;
  performedBy?: {
    name?: string;
    email?: string;
  };
  targetUser?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  createdAt?: string;
};

export default function Activity() {
  const [activities, setActivities] =
    useState<ActivityItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadActivity = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response =
          await adminApi.dashboard();

        setActivities(
          response?.recentActivity || []
        );
      } catch (err: any) {
        setError(
          err?.message ||
            "Unable to load activity. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  if (loading) {
    return (
      <div className="page">
        <div className="loadingBox">
          <span className="loader loaderLarge" />
          <span>
            Loading activity...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="head">
        <div>
          <h1 className="title">
            Activity
          </h1>

          <p className="sub">
            Latest recorded admin actions.
          </p>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() =>
              loadActivity(true)
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={15}
              className={
                refreshing
                  ? "spin"
                  : ""
              }
            />

            <span>
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="error"
          role="alert"
        >
          <div>
            <strong>
              Unable to load activity
            </strong>

            <div>{error}</div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() =>
              loadActivity()
            }
          >
            Try Again
          </button>
        </div>
      )}

      {/* Activity Card */}
      <section className="card">
        <div className="cardhead">
          <div>
            <strong>
              Admin Activity
            </strong>

            <p className="sub">
              Recent actions recorded by
              the administration.
            </p>
          </div>

          <div className="sectionIcon">
            <ActivityIcon size={18} />
          </div>
        </div>

        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Description</th>
                <th>Admin</th>
                <th>User</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {activities.map(
                (item) => (
                  <tr
                    key={item._id}
                  >
                    <td>
                      <span className="badge neutral">
                        {item.action ||
                          "-"}
                      </span>
                    </td>

                    <td>
                      {item.description ||
                        "-"}
                    </td>

                    <td>
                      {item.performedBy
                        ?.name ||
                        item.performedBy
                          ?.email ||
                        "-"}
                    </td>

                    <td>
                      {item.targetUser
                        ?.name ||
                        item.targetUser
                          ?.email ||
                        item.targetUser
                          ?.phone ||
                        "-"}
                    </td>

                    <td>
                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                )
              )}

              {!activities.length && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty">
                      <ActivityIcon
                        size={25}
                      />

                      <strong>
                        No activity found
                      </strong>

                      <span>
                        No admin actions have
                        been recorded yet.
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