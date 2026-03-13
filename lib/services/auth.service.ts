import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User, { type IUser, type SafeUser, type UserRole } from "@/models/User";
import {
  createToken,
  verifyToken,
  validatePasswordStrength,
  getAuthFromRequest,
  type TokenPayload,
} from "@/lib/auth";
import { NextRequest } from "next/server";

/* ================================================================
   Auth Service — KINYN
   ================================================================
   Server-side service layer for authentication operations.
   All functions connect to DB, validate, and return structured results.
   ================================================================ */

/* ──────────────── Types ──────────────── */

interface ServiceResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

interface AuthResponse {
  user: SafeUser;
  token: string;
}

/* ──────────────── Cookie Helpers ──────────────── */

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Create a NextResponse with the auth cookie set.
 */
export function setAuthCookie(
  response: NextResponse,
  token: string,
): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}

/**
 * Create a NextResponse with the auth cookie cleared.
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

/* ──────────────── Sign Up (Normal Users) ──────────────── */

interface SignUpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export async function signUp(
  input: SignUpInput,
): Promise<ServiceResult<AuthResponse>> {
  try {
    await connectDB();

    const { firstName, lastName, email, password, confirmPassword } = input;

    /* Validation */
    if (!firstName?.trim() || !lastName?.trim()) {
      return {
        success: false,
        error: "Le prénom et le nom sont requis.",
        status: 400,
      };
    }

    if (!email?.trim()) {
      return { success: false, error: "L'email est requis.", status: 400 };
    }

    if (!password) {
      return {
        success: false,
        error: "Le mot de passe est requis.",
        status: 400,
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: "Les mots de passe ne correspondent pas.",
        status: 400,
      };
    }

    /* Password strength */
    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      return { success: false, error: strengthError, status: 400 };
    }

    /* Check duplicate email */
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return {
        success: false,
        error: "Un compte avec cet email existe déjà.",
        status: 409,
      };
    }

    /* Create user (password hashed by pre-save hook) */
    const user: IUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: "user", // Always "user" for public sign-up
      status: "active",
    });

    /* Generate token */
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = createToken(tokenPayload);

    return {
      success: true,
      data: { user: user.toSafeObject(), token },
    };
  } catch (error) {
    console.error("[Auth Service] Sign-up error:", error);

    /* Handle mongoose validation errors */
    if (error instanceof Error && error.name === "ValidationError") {
      const messages = Object.values(
        (error as unknown as { errors: Record<string, { message: string }> })
          .errors,
      )
        .map((e) => e.message)
        .join(" ");
      return { success: false, error: messages, status: 400 };
    }

    /* Handle duplicate key (race condition) */
    if (
      error instanceof Error &&
      "code" in error &&
      (error as unknown as { code: number }).code === 11000
    ) {
      return {
        success: false,
        error: "Un compte avec cet email existe déjà.",
        status: 409,
      };
    }

    return {
      success: false,
      error: "Une erreur interne est survenue.",
      status: 500,
    };
  }
}

/* ──────────────── Sign In ──────────────── */

interface SignInInput {
  email: string;
  password: string;
}

export async function signIn(
  input: SignInInput,
): Promise<ServiceResult<AuthResponse>> {
  try {
    await connectDB();

    const { email, password } = input;

    if (!email?.trim() || !password) {
      return {
        success: false,
        error: "L'email et le mot de passe sont requis.",
        status: 400,
      };
    }

    /* Find user with password field included */
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password +loginAttempts +lockUntil");

    if (!user) {
      return {
        success: false,
        error: "Email ou mot de passe incorrect.",
        status: 401,
      };
    }

    /* Check account status */
    if (user.status === "suspended") {
      return {
        success: false,
        error: "Votre compte a été suspendu. Contactez l'administration.",
        status: 403,
      };
    }

    if (user.status === "inactive") {
      return {
        success: false,
        error: "Votre compte est désactivé. Contactez l'administration.",
        status: 403,
      };
    }

    /* Check account lock */
    if (user.isLocked()) {
      return {
        success: false,
        error:
          "Votre compte est temporairement verrouillé suite à trop de tentatives. Réessayez dans 30 minutes.",
        status: 423,
      };
    }

    /* Verify password */
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await user.incrementLoginAttempts();
      return {
        success: false,
        error: "Email ou mot de passe incorrect.",
        status: 401,
      };
    }

    /* Reset login attempts on success */
    await user.resetLoginAttempts();

    /* Generate token */
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    const token = createToken(tokenPayload);

    return {
      success: true,
      data: { user: user.toSafeObject(), token },
    };
  } catch (error) {
    console.error("[Auth Service] Sign-in error:", error);
    return {
      success: false,
      error: "Une erreur interne est survenue.",
      status: 500,
    };
  }
}

/* ──────────────── Get Current User ──────────────── */

export async function getCurrentUser(
  req: NextRequest,
): Promise<ServiceResult<SafeUser>> {
  try {
    /* Extract token from header or cookie */
    const authHeader = req.headers.get("authorization");
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      token = req.cookies.get(COOKIE_NAME)?.value;
    }

    if (!token) {
      return { success: false, error: "Non authentifié.", status: 401 };
    }

    /* Verify token */
    const payload = verifyToken(token);
    if (!payload) {
      return {
        success: false,
        error: "Session expirée ou invalide.",
        status: 401,
      };
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return {
        success: false,
        error: "Utilisateur introuvable.",
        status: 404,
      };
    }

    if (user.status !== "active") {
      return {
        success: false,
        error: "Votre compte n'est plus actif.",
        status: 403,
      };
    }

    return { success: true, data: user.toSafeObject() };
  } catch (error) {
    console.error("[Auth Service] Get current user error:", error);
    return {
      success: false,
      error: "Une erreur interne est survenue.",
      status: 500,
    };
  }
}

/* ──────────────── Update Current User Profile ──────────────── */

interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export async function updateProfile(
  req: NextRequest,
  input: UpdateProfileInput,
): Promise<ServiceResult<SafeUser>> {
  try {
    /* Extract token */
    const authHeader = req.headers.get("authorization");
    let token: string | undefined;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    } else {
      token = req.cookies.get(COOKIE_NAME)?.value;
    }

    if (!token) {
      return { success: false, error: "Non authentifié.", status: 401 };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return {
        success: false,
        error: "Session expirée ou invalide.",
        status: 401,
      };
    }

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) {
      return {
        success: false,
        error: "Utilisateur introuvable.",
        status: 404,
      };
    }

    if (user.status !== "active") {
      return {
        success: false,
        error: "Votre compte n'est plus actif.",
        status: 403,
      };
    }

    /* Update allowed fields */
    if (input.firstName?.trim()) user.firstName = input.firstName.trim();
    if (input.lastName?.trim()) user.lastName = input.lastName.trim();
    if (input.phone !== undefined) user.phone = input.phone.trim();

    await user.save();

    return { success: true, data: user.toSafeObject() };
  } catch (error) {
    console.error("[Auth Service] Update profile error:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      const messages = Object.values(
        (error as unknown as { errors: Record<string, { message: string }> })
          .errors,
      )
        .map((e) => e.message)
        .join(" ");
      return { success: false, error: messages, status: 400 };
    }

    return {
      success: false,
      error: "Une erreur interne est survenue.",
      status: 500,
    };
  }
}

/* ──────────────── Admin: Create Admin ──────────────── */

interface CreateAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  status?: "active" | "inactive";
  avatar?: string;
}

export async function createAdmin(
  input: CreateAdminInput,
  requesterPayload: TokenPayload,
): Promise<ServiceResult<SafeUser>> {
  try {
    await connectDB();

    /* Only admins and super_admins can create admins */
    if (
      requesterPayload.role !== "admin" &&
      requesterPayload.role !== "super_admin"
    ) {
      return {
        success: false,
        error: "Accès refusé. Droits insuffisants.",
        status: 403,
      };
    }

    /* Only super_admin can create another super_admin */
    if (
      input.role === "super_admin" &&
      requesterPayload.role !== "super_admin"
    ) {
      return {
        success: false,
        error:
          "Seul un super administrateur peut créer un autre super administrateur.",
        status: 403,
      };
    }

    /* Restrict role to admin roles only */
    const allowedRoles: UserRole[] = ["moderator", "admin", "super_admin"];
    if (!allowedRoles.includes(input.role)) {
      return {
        success: false,
        error: "Le rôle spécifié n'est pas valide pour un administrateur.",
        status: 400,
      };
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      status,
      avatar,
    } = input;

    /* Validation */
    if (!firstName?.trim() || !lastName?.trim()) {
      return {
        success: false,
        error: "Le prénom et le nom sont requis.",
        status: 400,
      };
    }

    if (!email?.trim()) {
      return { success: false, error: "L'email est requis.", status: 400 };
    }

    if (!password) {
      return {
        success: false,
        error: "Le mot de passe est requis.",
        status: 400,
      };
    }

    /* Password strength */
    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      return { success: false, error: strengthError, status: 400 };
    }

    /* Check duplicate */
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return {
        success: false,
        error: "Un compte avec cet email existe déjà.",
        status: 409,
      };
    }

    const admin: IUser = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() ?? "",
      password,
      role,
      status: status ?? "active",
      avatar: avatar ?? "",
    });

    return { success: true, data: admin.toSafeObject() };
  } catch (error) {
    console.error("[Auth Service] Create admin error:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      const messages = Object.values(
        (error as unknown as { errors: Record<string, { message: string }> })
          .errors,
      )
        .map((e) => e.message)
        .join(" ");
      return { success: false, error: messages, status: 400 };
    }

    if (
      error instanceof Error &&
      "code" in error &&
      (error as unknown as { code: number }).code === 11000
    ) {
      return {
        success: false,
        error: "Un compte avec cet email existe déjà.",
        status: 409,
      };
    }

    return {
      success: false,
      error: "Une erreur interne est survenue.",
      status: 500,
    };
  }
}

/* ──────────────── Admin: List Admins ──────────────── */

interface ListAdminsOptions {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function listAdmins(
  options: ListAdminsOptions = {},
): Promise<ServiceResult<{ admins: SafeUser[]; total: number }>> {
  try {
    await connectDB();

    const { search, role, status, page = 1, limit = 50 } = options;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      role: { $in: ["moderator", "admin", "super_admin"] },
    };

    if (role && role !== "all") {
      filter.role = role;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    if (search?.trim()) {
      const q = search.trim();
      filter.$or = [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    const safeAdmins: SafeUser[] = admins.map((a) => ({
      id: a._id.toString(),
      firstName: a.firstName,
      lastName: a.lastName,
      email: a.email,
      phone: a.phone,
      role: a.role,
      status: a.status,
      avatar: a.avatar,
      isEmailVerified: a.isEmailVerified,
      lastLogin: a.lastLogin,
      createdAt: a.createdAt,
      addresses: [],
      wishlist: [],
      orders: [],
    }));

    return { success: true, data: { admins: safeAdmins, total } };
  } catch (error) {
    console.error("[Auth Service] List admins error:", error);
    return {
      success: false,
      error: "Une erreur interne est survenue.",
      status: 500,
    };
  }
}

/* ──────────────── Admin: Update Admin ──────────────── */

interface UpdateAdminInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: UserRole;
  status?: "active" | "inactive";
  avatar?: string;
}

export async function updateAdmin(
  adminId: string,
  input: UpdateAdminInput,
  requesterPayload: TokenPayload,
): Promise<ServiceResult<SafeUser>> {
  try {
    await connectDB();

    /* Permission check */
    if (
      requesterPayload.role !== "admin" &&
      requesterPayload.role !== "super_admin"
    ) {
      return {
        success: false,
        error: "Accès refusé. Droits insuffisants.",
        status: 403,
      };
    }

    const admin = await User.findById(adminId).select("+password");
    if (!admin) {
      return {
        success: false,
        error: "Administrateur introuvable.",
        status: 404,
      };
    }

    /* Only super_admin can edit super_admins (unless editing self) */
    if (
      admin.role === "super_admin" &&
      requesterPayload.role !== "super_admin"
    ) {
      return {
        success: false,
        error:
          "Seul un super administrateur peut modifier un autre super administrateur.",
        status: 403,
      };
    }

    /* Only super_admin can promote to super_admin */
    if (
      input.role === "super_admin" &&
      requesterPayload.role !== "super_admin"
    ) {
      return {
        success: false,
        error: "Seul un super administrateur peut attribuer ce rôle.",
        status: 403,
      };
    }

    /* Update fields */
    if (input.firstName?.trim()) admin.firstName = input.firstName.trim();
    if (input.lastName?.trim()) admin.lastName = input.lastName.trim();
    if (input.phone !== undefined) admin.phone = input.phone.trim();
    if (input.role) admin.role = input.role;
    if (input.status) admin.status = input.status;
    if (input.avatar !== undefined) admin.avatar = input.avatar;

    /* Update email if changed */
    if (input.email && input.email.toLowerCase().trim() !== admin.email) {
      const emailExists = await User.findOne({
        email: input.email.toLowerCase().trim(),
        _id: { $ne: admin._id },
      });
      if (emailExists) {
        return {
          success: false,
          error: "Un autre compte utilise déjà cet email.",
          status: 409,
        };
      }
      admin.email = input.email.toLowerCase().trim();
    }

    /* Update password if provided */
    if (input.password) {
      const strengthError = validatePasswordStrength(input.password);
      if (strengthError) {
        return { success: false, error: strengthError, status: 400 };
      }
      admin.password = input.password; // Will be hashed by pre-save hook
    }

    await admin.save();

    return { success: true, data: admin.toSafeObject() };
  } catch (error) {
    console.error("[Auth Service] Update admin error:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      const messages = Object.values(
        (error as unknown as { errors: Record<string, { message: string }> })
          .errors,
      )
        .map((e) => e.message)
        .join(" ");
      return { success: false, error: messages, status: 400 };
    }

    if (
      error instanceof Error &&
      "code" in error &&
      (error as unknown as { code: number }).code === 11000
    ) {
      return {
        success: false,
        error: "Un autre compte utilise déjà cet email.",
        status: 409,
      };
    }

    return {
      success: false,
      error: "Une erreur interne est survenue.",
      status: 500,
    };
  }
}

/* ──────────────── Admin: Delete Admin ──────────────── */

export async function deleteAdmin(
  adminId: string,
  requesterPayload: TokenPayload,
): Promise<ServiceResult> {
  try {
    await connectDB();

    if (
      requesterPayload.role !== "admin" &&
      requesterPayload.role !== "super_admin"
    ) {
      return {
        success: false,
        error: "Accès refusé. Droits insuffisants.",
        status: 403,
      };
    }

    const admin = await User.findById(adminId);
    if (!admin) {
      return {
        success: false,
        error: "Administrateur introuvable.",
        status: 404,
      };
    }

    /* Cannot delete yourself */
    if (admin._id.toString() === requesterPayload.userId) {
      return {
        success: false,
        error: "Vous ne pouvez pas supprimer votre propre compte.",
        status: 400,
      };
    }

    /* Only super_admin can delete super_admins */
    if (
      admin.role === "super_admin" &&
      requesterPayload.role !== "super_admin"
    ) {
      return {
        success: false,
        error:
          "Seul un super administrateur peut supprimer un autre super administrateur.",
        status: 403,
      };
    }

    await User.findByIdAndDelete(adminId);

    return { success: true };
  } catch (error) {
    console.error("[Auth Service] Delete admin error:", error);
    return {
      success: false,
      error: "Une erreur interne est survenue.",
      status: 500,
    };
  }
}

/* ──────────────── DB-Aware Role Check ──────────────── */

/**
 * Verify the caller's role by fetching fresh data from the DB.
 * Unlike the JWT-only check, this reflects role changes without re-login.
 */
export async function requireRoleFromDB(
  req: NextRequest,
  roles: string[],
): Promise<{ payload: TokenPayload } | { error: NextResponse }> {
  const jwtPayload = getAuthFromRequest(req);
  if (!jwtPayload) {
    return {
      error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }

  await connectDB();
  const user = await User.findById(jwtPayload.userId).select("role status");

  if (!user) {
    return {
      error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }

  if (user.status !== "active") {
    return {
      error: NextResponse.json(
        { error: "Votre compte n'est plus actif." },
        { status: 403 },
      ),
    };
  }

  if (!roles.includes(user.role as string)) {
    return {
      error: NextResponse.json(
        { error: "Accès refusé. Droits insuffisants." },
        { status: 403 },
      ),
    };
  }

  return { payload: { ...jwtPayload, role: user.role as string } };
}

export async function requireSuperAdminFromDB(req: NextRequest) {
  return requireRoleFromDB(req, ["super_admin"]);
}

/* ──────────────── Admin Stats ──────────────── */

export async function getAdminStats(): Promise<
  ServiceResult<{
    total: number;
    active: number;
    inactive: number;
    superAdmin: number;
  }>
> {
  try {
    await connectDB();

    const [total, active, inactive, superAdmin] = await Promise.all([
      User.countDocuments({
        role: { $in: ["moderator", "admin", "super_admin"] },
      }),
      User.countDocuments({
        role: { $in: ["moderator", "admin", "super_admin"] },
        status: "active",
      }),
      User.countDocuments({
        role: { $in: ["moderator", "admin", "super_admin"] },
        status: "inactive",
      }),
      User.countDocuments({ role: "super_admin" }),
    ]);

    return { success: true, data: { total, active, inactive, superAdmin } };
  } catch (error) {
    console.error("[Auth Service] Admin stats error:", error);
    return {
      success: false,
      error: "Une erreur interne est survenue.",
      status: 500,
    };
  }
}
