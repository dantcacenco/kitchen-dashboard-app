/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as dashboardLayout from "../dashboardLayout.js";
import type * as income from "../income.js";
import type * as incomeSources from "../incomeSources.js";
import type * as metalHoldings from "../metalHoldings.js";
import type * as savingsGoals from "../savingsGoals.js";
import type * as shoppingList from "../shoppingList.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  dashboardLayout: typeof dashboardLayout;
  income: typeof income;
  incomeSources: typeof incomeSources;
  metalHoldings: typeof metalHoldings;
  savingsGoals: typeof savingsGoals;
  shoppingList: typeof shoppingList;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
