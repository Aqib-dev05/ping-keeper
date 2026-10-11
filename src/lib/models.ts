import mongoose, { Schema, Model, Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface IMonitor {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  url: string;
  intervalMin: number;
  active: boolean;
  lastOk: boolean | null;
  lastStatus: number | null;
  lastResponseMs: number | null;
  lastCheckedAt: Date | null;
  createdAt: Date;
}

export interface IPingLog {
  _id: Types.ObjectId;
  monitorId: Types.ObjectId;
  ok: boolean;
  status: number | null;
  responseMs: number;
  error: string | null;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const monitorSchema = new Schema<IMonitor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    intervalMin: { type: Number, default: 10 },
    active: { type: Boolean, default: true },
    lastOk: { type: Boolean, default: null },
    lastStatus: { type: Number, default: null },
    lastResponseMs: { type: Number, default: null },
    lastCheckedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
monitorSchema.index({ active: 1, lastCheckedAt: 1 });

const pingLogSchema = new Schema<IPingLog>({
  monitorId: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
  ok: { type: Boolean, required: true },
  status: { type: Number, default: null },
  responseMs: { type: Number, required: true },
  error: { type: String, default: null },
  // TTL index: MongoDB 7 din baad logs khud delete kar deta hai
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 7 },
});
pingLogSchema.index({ monitorId: 1, createdAt: -1 });

export const User = (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", userSchema);
export const Monitor = (mongoose.models.Monitor as Model<IMonitor>) || mongoose.model<IMonitor>("Monitor", monitorSchema);
export const PingLog = (mongoose.models.PingLog as Model<IPingLog>) || mongoose.model<IPingLog>("PingLog", pingLogSchema);
