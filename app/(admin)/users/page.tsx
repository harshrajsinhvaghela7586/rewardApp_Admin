"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Eye,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { adminApi } from "../../../lib/api";

type UsersResponse = {
  users?: any[];
  pagination?: {
    page?: number;
    pages?: number;
    total?: number;
  };
};

const LIMIT = 10;
const SEARCH_DEBOUNCE = 3000;

export default function Users() {
  const [data, setData] =
    useState<UsersResponse | null>(null);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  const loadUsers = useCallback(
    async (
      requestedPage: number,
      requestedQuery: string,
      requestedStatus: string,
      isSearch = false
    ) => {
      const currentRequest = ++requestId.current;

      try {
        if (isSearch) {
          setSearching(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await adminApi.users({
          page: requestedPage,
          limit: LIMIT,
          search: requestedQuery.trim(),
          status: requestedStatus,
        });

        /*
         * Prevent an old/slow API response from
         * overwriting the latest request.
         */
        if (currentRequest !== requestId.current) {
          return;
        }

        setData(response);
      } catch (err: any) {
        if (currentRequest !== requestId.current) {
          return;
        }

        setError(
          err?.message ||
            "Unable to load users. Please try again."
        );
      } finally {
        if (currentRequest === requestId.current) {
          setLoading(false);
          setSearching(false);
        }
      }
    },
    []
  );

  /*
   * Initial load + pagination + status filter.
   */
  useEffect(() => {
    loadUsers(
      page,
      query,
      status
    );
  }, [page, status, loadUsers]);

  /*
   * 3 second search debounce.
   */
  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPage((currentPage) => {
        if (currentPage !== 1) {
          return 1;
        }

        loadUsers(
          1,
          trimmedQuery,
          status,
          true
        );

        return currentPage;
      });
    }, SEARCH_DEBOUNCE);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, status, loadUsers]);

  const pagination = data?.pagination;

  const currentPage =
    pagination?.page ?? page;

  const totalPages =
    pagination?.pages ?? 1;

  const totalUsers =
    pagination?.total ?? 0;

  const users = data?.users || [];

  const clearSearch = () => {
    setQuery("");
    setPage(1);

    loadUsers(
      1,
      "",
      status
    );
  };

  const handleManualSearch = () => {
    setPage(1);

    loadUsers(
      1,
      query,
      status,
      true
    );
  };

  const handleStatusChange = (
    value: string
  ) => {
    setStatus(value);
    setPage(1);
  };

  if (loading && !data) {
    return (
      <div className="page">
        <div className="loadingBox">
          <span className="loader loaderLarge" />
          <span>Loading users...</span>
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
            Users
          </h1>

          <p className="sub">
            Manage customers and their
            applications.
          </p>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn"
            disabled={
              loading || searching
            }
            onClick={() =>
              loadUsers(
                currentPage,
                query,
                status
              )
            }
          >
            <RefreshCw
              size={15}
              className={
                loading || searching
                  ? "spin"
                  : ""
              }
            />

            <span>
              {loading || searching
                ? "Loading..."
                : "Refresh"}
            </span>
          </button>

          <Link
            className="btn primary"
            href="/users/new"
          >
            <Plus size={15} />
            <span>Add User</span>
          </Link>
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
              Unable to load users
            </strong>

            <div>{error}</div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() =>
              loadUsers(
                currentPage,
                query,
                status
              )
            }
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div className="searchWrap">
          <Search
            size={17}
            className="searchIcon"
            aria-hidden="true"
          />

          <input
            className="input"
            type="search"
            placeholder="Search name, email or phone..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);

              if (page !== 1) {
                setPage(1);
              }
            }}
            aria-label="Search users"
          />

          {query && (
            <button
              type="button"
              className="searchClear"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <select
          className="select"
          value={status}
          onChange={(event) =>
            handleStatusChange(
              event.target.value
            )
          }
          aria-label="Filter users by status"
        >
          <option value="">
            All statuses
          </option>

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

        <button
          type="button"
          className="btn primary"
          onClick={handleManualSearch}
          disabled={searching}
        >
          <Search size={15} />

          <span>
            {searching
              ? "Searching..."
              : "Search"}
          </span>
        </button>
      </div>

      {/* Search status */}
      <div className="pageFilterInfo">
        {searching ? (
          <span className="inlineLoader">
            <span className="loader" />
            Searching users...
          </span>
        ) : query.trim() ? (
          "Search updates automatically after 3 seconds."
        ) : (
          `${totalUsers.toLocaleString()} total users`
        )}
      </div>

      {/* Users */}
      <section className="card">
        <div className="cardhead">
          <div>
            <strong>
              Customer Users
            </strong>

            <p className="sub">
              View and manage registered
              customers.
            </p>
          </div>
        </div>

        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map(
                (user: any) => {
                  const userStatus =
                    user.status ||
                    "inactive";

                  return (
                    <tr
                      key={user._id}
                    >
                      <td>
                        <strong>
                          {user.name ||
                            "-"}
                        </strong>
                      </td>

                      <td>
                        {user.phone ||
                          "-"}
                      </td>

                      <td>
                        {user.email ||
                          "-"}
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            userStatus ===
                            "active"
                              ? "ok"
                              : userStatus ===
                                "blocked"
                              ? "bad"
                              : "warn"
                          }`}
                        >
                          {userStatus}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            user.isVerified
                              ? "ok"
                              : "neutral"
                          }`}
                        >
                          {user.isVerified
                            ? "Verified"
                            : "Not Verified"}
                        </span>
                      </td>

                      <td>
                        {user.createdAt
                          ? new Date(
                              user.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <Link
                          className="btn"
                          href={`/users/${user._id}`}
                          aria-label={`View ${
                            user.name ||
                            "user"
                          }`}
                        >
                          <Eye size={15} />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  )
                }
              )}

              {!users.length &&
                !loading && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty">
                        {query.trim()
                          ? "No users found for this search."
                          : "No users found."}
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="paginationInfo">
              Page{" "}
              <strong>
                {currentPage}
              </strong>{" "}
              of{" "}
              <strong>
                {totalPages}
              </strong>

              {totalUsers > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <strong>
                    {totalUsers.toLocaleString()}
                  </strong>{" "}
                  users
                </>
              )}
            </div>

            <div className="paginationActions">
              <button
                type="button"
                className="pageBtn"
                disabled={
                  currentPage <= 1 ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (value) =>
                      Math.max(
                        1,
                        value - 1
                      )
                  )
                }
              >
                <span>Previous</span>
              </button>

              <div className="pageNumber">
                {currentPage}
              </div>

              <button
                type="button"
                className="pageBtn"
                disabled={
                  currentPage >=
                    totalPages ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (value) =>
                      Math.min(
                        totalPages,
                        value + 1
                      )
                  )
                }
              >
                <span>Next</span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}