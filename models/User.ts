import mongoose, { Schema, type Document, type Model } from "mongoose";
import bcrypt from "bcryptjs";

/* ================================================================
   User Model — KINYN
   ================================================================
   Roles: "user" (default for sign-up) | "admin" | "super_admin"
   
   Security features:
   • Password hashed with bcrypt (12 rounds) on save
   • Password excluded from queries by default (select: false)
   • Email uniqueness enforced at DB level
   • Login attempt tracking for brute-force protection
   • Account locking after 5 failed attempts
   • Timestamps for audit trail
   ================================================================ */

/* ──────────────────── Types ──────────────────── */

export type UserRole = "user" | "admin" | "super_admin";
export type UserStatus = "active" | "inactive" | "suspended";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  isEmailVerified: boolean;
  loginAttempts: number;
  lockUntil: Date | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;

  /* Instance methods */
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  toSafeObject(): SafeUser;
}

/** User data safe for client responses (no password, no internals) */
export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  isEmailVerified: boolean;
  lastLogin: Date | null;
  createdAt: Date;
}

/* ──────────────────── Constants ──────────────────── */

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/* ──────────────────── Schema ──────────────────── */

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, "Le prénom est requis."],
      trim: true,
      minlength: [2, "Le prénom doit contenir au moins 2 caractères."],
      maxlength: [50, "Le prénom ne peut pas dépasser 50 caractères."],
    },
    lastName: {
      type: String,
      required: [true, "Le nom est requis."],
      trim: true,
      minlength: [2, "Le nom doit contenir au moins 2 caractères."],
      maxlength: [50, "Le nom ne peut pas dépasser 50 caractères."],
    },
    email: {
      type: String,
      required: [true, "L'email est requis."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Veuillez entrer un email valide."],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Le mot de passe est requis."],
      minlength: [8, "Le mot de passe doit contenir au moins 8 caractères."],
      select: false, // Never returned by default
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "super_admin"],
        message: "Le rôle '{VALUE}' n'est pas valide.",
      },
      default: "user",
    },
    status: {
      type: String,
      enum: {
        values: ["active", "inactive", "suspended"],
        message: "Le statut '{VALUE}' n'est pas valide.",
      },
      default: "active",
    },
    avatar: {
      type: String,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
    toObject: {
      transform(_doc, ret: Record<string, unknown>) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        return ret;
      },
    },
  },
);

/* ──────────────── Pre-save: Hash password ──────────────── */

userSchema.pre("save", async function () {
  // Only hash if password was modified
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

/* ──────────────── Instance Methods ──────────────── */

/** Compare candidate password with stored hash */
userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/** Check if account is currently locked */
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

/** Increment failed login attempts; lock if threshold reached */
userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // If lock expired, reset attempts
  if (this.lockUntil && this.lockUntil < new Date()) {
    await this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
    return;
  }

  const updates: Record<string, unknown> = {
    $inc: { loginAttempts: 1 },
  };

  // Lock account if max attempts reached
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS) {
    updates.$set = {
      lockUntil: new Date(Date.now() + LOCK_DURATION_MS),
    };
  }

  await this.updateOne(updates);
};

/** Reset login attempts on successful login */
userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  await this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 },
  });
};

/** Return a safe object for API responses */
userSchema.methods.toSafeObject = function (): SafeUser {
  return {
    id: this._id.toString(),
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    status: this.status,
    avatar: this.avatar,
    isEmailVerified: this.isEmailVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

/* ──────────────── Indexes ──────────────── */

userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

/* ──────────────── Model ──────────────── */

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
