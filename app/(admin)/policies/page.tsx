"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  FileText,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { adminApi } from "../../../lib/api";

type PoliciesResponse = {
  users?: any[];
  pagination?: {
    page?: number;
    pages?: number;
    total?: number;
  };
};

type PolicyState = {
  loading: boolean;
  policy: any;
  error: string;
};

const LIMIT = 10;
const SEARCH_DEBOUNCE = 3000;

export default function Policies() {
  const [data, setData] =
    useState<PoliciesResponse | null>(null);

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  /*
   * Store policy information per user.
   *
   * This prevents policy data from being
   * unnecessarily recreated while rendering.
   */
  const [policies, setPolicies] =
    useState<Record<string, PolicyState>>(
      {}
    );

  const requestId = useRef(0);

  const loadPolicies = useCallback(
    async (
      requestedPage: number,
      requestedQuery: string,
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

        const response =
          await adminApi.users({
            page: requestedPage,
            limit: LIMIT,
            search: requestedQuery.trim(),
          });

        if (
          currentRequest !==
          requestId.current
        ) {
          return;
        }

        setData(response);

        /*
         * Reset policy states for the
         * newly visible page.
         */
        setPolicies({});

        /*
         * Only fetch policies for users
         * currently visible on this page.
         */
        const users =
          response?.users || [];

        await Promise.all(
          users.map(async (user: any) => {
            if (!user?._id) return;

            setPolicies((previous) => ({
              ...previous,
              [user._id]: {
                loading: true,
                policy: null,
                error: "",
              },
            }));

            try {
              const result =
                await adminApi.policy(
                  user._id
                );

              if (
                currentRequest !==
                requestId.current
              ) {
                return;
              }

              setPolicies(
                (previous) => ({
                  ...previous,
                  [user._id]: {
                    loading: false,
                    policy:
                      result?.policy ||
                      null,
                    error: "",
                  },
                })
              );
            } catch (err: any) {
              if (
                currentRequest !==
                requestId.current
              ) {
                return;
              }

              setPolicies(
                (previous) => ({
                  ...previous,
                  [user._id]: {
                    loading: false,
                    policy: null,
                    error:
                      err?.message ||
                      "Unable to load",
                  },
                })
              );
            }
          })
        );
      } catch (err: any) {
        if (
          currentRequest !==
          requestId.current
        ) {
          return;
        }

        setError(
          err?.message ||
            "Unable to load policies. Please try again."
        );
      } finally {
        if (
          currentRequest ===
          requestId.current
        ) {
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
    loadPolicies(
      page,
      query
    );
  }, [page, loadPolicies]);

  /*
   * 3 second search debounce.
   */
  useEffect(() => {
    const trimmedQuery =
      query.trim();

    if (!trimmedQuery) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setPage((currentPage) => {
          if (currentPage !== 1) {
            return 1;
          }

          loadPolicies(
            1,
            trimmedQuery,
            true
          );

          return currentPage;
        });
      }, SEARCH_DEBOUNCE);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, loadPolicies]);

  const clearSearch = () => {
    setQuery("");
    setPage(1);

    loadPolicies(
      1,
      ""
    );
  };

  const handleManualSearch = () => {
    setPage(1);

    loadPolicies(
      1,
      query,
      true
    );
  };

  const pagination =
    data?.pagination;

  const currentPage =
    pagination?.page ?? page;

  const totalPages =
    pagination?.pages ?? 1;

  const total =
    pagination?.total ?? 0;

  const users =
    data?.users || [];

  if (loading && !data) {
    return (
      <div className="page">
        <div className="loadingBox">
          <span className="loader loaderLarge" />
          <span>
            Loading policies...
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
            Policies
          </h1>

          <p className="sub">
            Customer policy records.
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
              loadPolicies(
                currentPage,
                query
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
              Unable to load policies
            </strong>

            <div>{error}</div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() =>
              loadPolicies(
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
            placeholder="Search customer by name, email or phone..."
            value={query}
            onChange={(event) => {
              setQuery(
                event.target.value
              );

              if (page !== 1) {
                setPage(1);
              }
            }}
            aria-label="Search policies"
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
            `${total.toLocaleString()} customers`
          )}
        </div>

        <button
          type="button"
          className="btn primary"
          disabled={searching}
          onClick={handleManualSearch}
        >
          <Search size={15} />

          <span>
            Search
          </span>
        </button>
      </div>

      {/* Policy table */}
      <section className="card">
        <div className="cardhead">
          <div>
            <strong>
              Customer Policies
            </strong>

            <p className="sub">
              Policy records associated
              with customer accounts.
            </p>
          </div>
        </div>

        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Policy Number</th>
                <th>Policy Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map(
                (user: any) => {
                  const state =
                    policies[
                      user._id
                    ];

                  const policy =
                    state?.policy;

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
                        {state?.loading ? (
                          <span className="tableLoading">
                            <span className="loader" />
                            Loading...
                          </span>
                        ) : state?.error ? (
                          <span className="textDanger">
                            Unable to load
                          </span>
                        ) : policy
                            ?.policyNumber ? (
                          <strong>
                            {
                              policy.policyNumber
                            }
                          </strong>
                        ) : (
                          <span className="muted">
                            No policy
                          </span>
                        )}
                      </td>

                      <td>
                        {state?.loading ? (
                          <span className="badge neutral">
                            Loading
                          </span>
                        ) : policy ? (
                          <span
                            className={`badge ${
                              policy.status ===
                              "active"
                                ? "ok"
                                : policy.status ===
                                  "expired"
                                ? "bad"
                                : "warn"
                            }`}
                          >
                            {policy.status ||
                              "Available"}
                          </span>
                        ) : (
                          <span className="badge neutral">
                            No Policy
                          </span>
                        )}
                      </td>

                      <td>
                        <Link
                          className="btn"
                          href={`/users/${user._id}`}
                          aria-label={`View policy for ${
                            user.name ||
                            "customer"
                          }`}
                        >
                          <FileText
                            size={15}
                          />
                          <span>
                            View
                          </span>
                        </Link>
                      </td>
                    </tr>
                  );
                }
              )}

              {!users.length &&
                !loading && (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty">
                        {query.trim()
                          ? "No policy records found for this search."
                          : "No policy records found."}
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

              {total > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <strong>
                    {total.toLocaleString()}
                  </strong>{" "}
                  customers
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
                <span>
                  Previous
                </span>
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
                <span>
                  Next
                </span>
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}