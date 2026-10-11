// Sab users ke liye same free limits. Env se change kar sakte ho.
export const LIMITS = {
  maxMonitors: Number(process.env.MAX_MONITORS ?? 50),
  intervals: [5, 10, 15, 30, 60], // minutes
};
