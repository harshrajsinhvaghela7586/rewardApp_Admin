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
  Gift,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { adminApi } from "../../../lib/api";

type RewardsResponse = {
  users?: any[];
  pagination?: {
    page?: number;
    pages?: number;
    total?: number;
  };
};

type RewardState = {
  loading: boolean;
  stats: any;
  error: string;
};

const LIMIT = 10;
const SEARCH_DEBOUNCE = 3000;

export default function Rewards() {
  const [data, setData] =
    useState<RewardsResponse | null>(
      null
    );

  const [query, setQuery] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [searching, setSearching] =
    useState(false);

  const [error, setError] =
    useState("");

  const [rewardStats, setRewardStats] =
    useState<
      Record<string, RewardState>
    >({});

  const requestId =
    useRef(0);

  const loadRewards = useCallback(
    async (
      requestedPage: number,
      requestedQuery: string,
      isSearch = false
    ) => {
      const currentRequest =
        ++requestId.current;

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
            search:
              requestedQuery.trim(),
          });

        if (
          currentRequest !==
          requestId.current
        ) {
          return;
        }

        setData(response);

        /*
         * Clear old page statistics.
         */
        setRewardStats({});

        const users =
          response?.users || [];

        /*
         * Fetch reward statistics only
         * for users visible on this page.
         */
        await Promise.all(
          users.map(
            async (user: any) => {
              if (!user?._id) {
                return;
              }

              setRewardStats(
                (previous) => ({
                  ...previous,
                  [user._id]: {
                    loading: true,
                    stats: null,
                    error: "",
                  },
                })
              );

              try {
                const response =
                  await adminApi.cards(
                    user._id
                  );

                if (
                  currentRequest !==
                  requestId.current
                ) {
                  return;
                }

                setRewardStats(
                  (previous) => ({
                    ...previous,
                    [user._id]: {
                      loading: false,
                      stats:
                        response?.stats ||
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

                setRewardStats(
                  (previous) => ({
                    ...previous,
                    [user._id]: {
                      loading: false,
                      stats: null,
                      error:
                        err?.message ||
                        "Unable to load",
                    },
                  })
                );
              }
            }
          )
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
            "Unable to load rewards. Please try again."
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
    loadRewards(
      page,
      query
    );
  }, [page, loadRewards]);

  /*
   * 3-second debounce search.
   */
  useEffect(() => {
    const trimmedQuery =
      query.trim();

    if (!trimmedQuery) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setPage(
          (currentPage) => {
            if (
              currentPage !== 1
            ) {
              return 1;
            }

            loadRewards(
              1,
              trimmedQuery,
              true
            );

            return currentPage;
          }
        );
      }, SEARCH_DEBOUNCE);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [query, loadRewards]);

  const clearSearch = () => {
    setQuery("");
    setPage(1);

    loadRewards(
      1,
      ""
    );
  };

  const handleSearch = () => {
    setPage(1);

    loadRewards(
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
            Loading rewards...
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
            Rewards
          </h1>

          <p className="sub">
            Customer scratch cards and
            reward history.
          </p>
        </div>

        <div className="actions">
          <button
            type="button"
            className="btn"
            disabled={
              loading ||
              searching
            }
            onClick={() =>
              loadRewards(
                currentPage,
                query
              )
            }
          >
            <RefreshCw
              size={15}
              className={
                loading ||
                searching
                  ? "spin"
                  : ""
              }
            />

            <span>
              {loading ||
              searching
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
              Unable to load rewards
            </strong>

            <div>{error}</div>
          </div>

          <button
            type="button"
            className="btn"
            onClick={() =>
              loadRewards(
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
            aria-label="Search rewards"
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
          onClick={handleSearch}
        >
          <Search size={15} />

          <span>
            Search
          </span>
        </button>
      </div>

      {/* Rewards table */}
      <section className="card">
        <div className="cardhead">
          <div>
            <strong>
              Customer Rewards
            </strong>

            <p className="sub">
              Scratch card statistics for
              each customer.
            </p>
          </div>

          <div className="sectionIcon">
            <Gift size={18} />
          </div>
        </div>

        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Cards</th>
                <th>Total Amount</th>
                <th>Redeemed</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map(
                (user: any) => {
                  const state =
                    rewardStats[
                      user._id
                    ];

                  const stats =
                    state?.stats;

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
                          <TableLoading />
                        ) : state?.error ? (
                          <span className="textDanger">
                            —
                          </span>
                        ) : (
                          <span className="badge neutral">
                            {Number(
                              stats?.totalIssued ||
                                0
                            ).toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td>
                        {state?.loading ? (
                          <TableLoading />
                        ) : state?.error ? (
                          <span className="textDanger">
                            —
                          </span>
                        ) : (
                          <strong>
                            ₹
                            {Number(
                              stats?.totalAmount ||
                                0
                            ).toLocaleString()}
                          </strong>
                        )}
                      </td>

                      <td>
                        {state?.loading ? (
                          <TableLoading />
                        ) : state?.error ? (
                          <span className="textDanger">
                            —
                          </span>
                        ) : (
                          <span className="badge ok">
                            {Number(
                              stats?.totalRedeemed ||
                                0
                            ).toLocaleString()}
                          </span>
                        )}
                      </td>

                      <td>
                        <Link
                          className="btn"
                          href={`/users/${user._id}`}
                          aria-label={`View rewards for ${
                            user.name ||
                            "customer"
                          }`}
                        >
                          <Gift
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
                    <td colSpan={6}>
                      <div className="empty">
                        <Gift
                          size={25}
                        />

                        <strong>
                          No customers found
                        </strong>

                        <span>
                          {query.trim()
                            ? "No customers match your search."
                            : "No customers are available."}
                        </span>
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
                <ChevronLeft
                  size={16}
                />

                <span>
                  Previous
                </span>
              </button>

              <div className="pageNumber">
                Page{" "}
                <strong>
                  {currentPage}
                </strong>
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

                <ChevronRight
                  size={16}
                />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function TableLoading() {
  return (
    <span className="tableLoading">
      <span className="loader" />
      Loading
    </span>
  );
}