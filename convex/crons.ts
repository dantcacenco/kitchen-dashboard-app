import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Update metal prices every 15 minutes during market hours
// Note: This runs in UTC, adjust times for your timezone
crons.interval(
  "update metal prices",
  { minutes: 15 },
  internal.metalPricesUpdater.updatePrices
);

export default crons;
