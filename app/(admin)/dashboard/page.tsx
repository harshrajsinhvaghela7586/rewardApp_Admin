"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { adminApi } from "../../../lib/api";

type ApplicationsResponse = {
  users?: any[];
  total?: number;
  totalUsers?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  pages?: number;
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    pages?: number;
  };
};

const LIMIT = 10;
const DEBOUNCE_TIME = 3000;

export default function Applications() {
  const [data, setData] =
    useState<ApplicationsResponse | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  const loadApplications = useCallback(
    async (
      requestedPage: number,
      requestedSearch: string,
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
          search: requestedSearch.trim(),
        });

        /*
         * Prevent an older/slower API response
         * from replacing the latest response.
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
            "Unable to load applications. Please try again."
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
   * Initial load + pagination.
   */
  useEffect(() => {
    loadApplications(page, query);
  }, [page, loadApplications]);

  /*
   * 3 second search debounce.
   */
  useEffect(() => {
    const trimmedQuery = query.trim();

    /*
     * Initial page load is handled by the page effect.
     * Don't trigger another request for empty initial query.
     */
    if (!trimmedQuery) {
      return;
    }

    const timer = window.setTimeout(() => {
      setPage((currentPage) => {
        if (currentPage !== 1) {
          return 1;
        }

        loadApplications(1, trimmedQuery, true);
        return currentPage;
      });
    }, DEBOUNCE_TIME);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, loadApplications]);

  /*
   * Clear search.
   */
  const clearSearch = () => {
    setQuery("");
    setPage(1);

    /*
     * Immediately load all applications.
     */
    loadApplications(1, "");
  };

  /*
   * Manual search button.
   */
  const handleManualSearch = () => {
    setPage(1);
    loadApplications(1, query, true);
  };

  /*
   * Pagination values.
   *
   * Supports common backend response structures:
   *
   * {
   *   total,
   *   totalPages
   * }
   *
   * or
   *
   * {
   *   pagination: {
   *     total,
   *     totalPages
   *   }
   * }
   */
  const pagination = data?.pagination || {};

  const total =
    pagination.total ??
    data?.total ??
    data?.totalUsers ??
    0;

  const totalPages =
    pagination.totalPages ??
    pagination.pages ??
    data?.totalPages ??
    data?.pages ??
    Math.ceil(total / LIMIT);

  const currentPage =
    pagination.page ??
    data?.page ??
    page;

  const users = data?.users || [];

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  /*
   * Full initial loader.
   */
  if (loading && !data) {
    return (
      <div className="page">
        <div className="loadingBox">
          <span className="loader loaderLarge" />
          <span>Loading applications...</span>
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
            Applications
          </h1>

          <p className="sub">
            Applications represented by the existing
            User records.
          </p>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn"
            onClick={() =>
              loadApplications(
                currentPage,
                query
              )
            }
            disabled={loading || searching}
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
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="error" role="alert">
          <div>
            <strong>
              Unable to load applications
            </strong>

            <div>{error}</div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() =>
              loadApplications(
                currentPage,
                query
              )
            }
          >
            Try Again
          </button>
        </div>
      )}

      {/* Search */}
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
            placeholder="Search by name, phone, email..."
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);

              /*
               * Whenever user starts typing again,
               * pagination should begin from page 1.
               */
              if (page !== 1) {
                setPage(1);
              }
            }}
            aria-label="Search applications"
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

        <div className="searchStatus">
          {searching ? (
            <>
              <span className="loader" />
              Searching...
            </>
          ) : query.trim() ? (
            "Search updates after 3 seconds"
          ) : (
            `${total.toLocaleString()} applications`
          )}
        </div>

        <button
          type="button"
          className="btn primary"
          onClick={handleManualSearch}
          disabled={searching}
        >
          <Search size={15} />
          Search
        </button>
      </div>

      {/* Applications Table */}
      <section className="card">
        <div className="cardhead">
          <div>
            <strong>
              Applications
            </strong>

            <p className="sub">
              {total.toLocaleString()}{" "}
              total records
            </p>
          </div>
        </div>

        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Phone</th>
                <th>Vehicle</th>
                <th>Documents</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user: any) => {
                const documents = [
                  user.rcFileUrl,
                  user.previousPolicyUrl,
                  user.aadhaarUrl,
                  user.panUrl,
                ].filter(Boolean).length;

                const status =
                  user.status || "pending";

                return (
                  <tr key={user._id}>
                    <td>
                      <strong>
                        {user.name || "-"}
                      </strong>
                    </td>

                    <td>
                      {user.phone || "-"}
                    </td>

                    <td>
                      {user.vehicleDetails || "-"}
                    </td>

                    <td>
                      <span className="badge neutral">
                        {documents}/4
                      </span>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          status === "active"
                            ? "ok"
                            : status ===
                              "blocked"
                            ? "bad"
                            : "warn"
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td>
                      <Link
                        className="btn"
                        href={`/users/${user._id}`}
                        aria-label={`View ${
                          user.name ||
                          "application"
                        }`}
                      >
                        <Eye size={15} />
                        <span>View</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {!users.length && !loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">
                      {query.trim()
                        ? "No applications found for this search."
                        : "No applications found."}
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
              Showing{" "}
              <strong>
                {Math.min(
                  (currentPage - 1) * LIMIT + 1,
                  total
                )}
              </strong>{" "}
              -{" "}
              <strong>
                {Math.min(
                  currentPage * LIMIT,
                  total
                )}
              </strong>{" "}
              of{" "}
              <strong>
                {total.toLocaleString()}
              </strong>
            </div>

            <div className="paginationActions">
              <button
                type="button"
                className="pageBtn"
                onClick={() =>
                  setPage((value) =>
                    Math.max(1, value - 1)
                  )
                }
                disabled={
                  !hasPrevious || loading
                }
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>

              <div className="pageNumber">
                Page{" "}
                <strong>
                  {currentPage}
                </strong>{" "}
                of{" "}
                <strong>
                  {totalPages}
                </strong>
              </div>

              <button
                type="button"
                className="pageBtn"
                onClick={() =>
                  setPage((value) =>
                    Math.min(
                      totalPages,
                      value + 1
                    )
                  )
                }
                disabled={
                  !hasNext || loading
                }
                aria-label="Next page"
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}