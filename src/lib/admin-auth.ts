import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { normaliseMpesaPhone } from '@/lib/mpesa';
import { getSupabaseAdminClient } from '@/lib/supabase/server';

export const ADMIN_SESSION_COOKIE = 'gsm_admin_session';
export const SUPER_ADMIN_ID = 'super-admin';

export type AdminRole = 'super_admin' | 'admin';

export interface AdminIdentity {
  id: string;
  role: AdminRole;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  createdByAdminId: string | null;
}

interface AdminRecord extends AdminIdentity {
  passwordHash: string;
}

export interface AdminSession {
  token: string;
  adminId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AdminAuditEntry {
  id: string;
  at: string;
  action: string;
  status: 'success' | 'failed';
  actorId: string | null;
  actorLabel: string;
  summary: string;
  target: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

interface AdminRow {
  id: string;
  role: AdminRole;
  name: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  created_at: string;
  created_by_admin_id: string | null;
}

interface AdminSessionRow {
  token: string;
  admin_id: string;
  created_at: string;
  expires_at: string;
}

interface AdminAuditRow {
  id: string;
  at: string;
  action: string;
  status: 'success' | 'failed';
  actor_id: string | null;
  actor_label: string;
  summary: string;
  target: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

const managedAdmins = new Map<string, AdminRecord>();
const adminSessions = new Map<string, AdminSession>();
const adminAuditTrail: AdminAuditEntry[] = [];
const MAX_AUDIT_ENTRIES = 200;
const ADMIN_SELECT =
  'id, role, name, email, phone, password_hash, created_at, created_by_admin_id';

function trimEnv(value: string | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

function normaliseAdminPhone(phone: string | null): string | null {
  if (!phone) return null;

  try {
    return normaliseMpesaPhone(phone);
  } catch {
    return null;
  }
}

function normaliseEmail(email: string | null): string | null {
  if (!email) return null;
  const next = email.trim().toLowerCase();
  return next || null;
}

function makeAdminId(prefix: 'admin' | 'super', seed?: string) {
  if (prefix === 'super') return SUPER_ADMIN_ID;
  const shortSeed = seed ? seed.replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase() : '';
  return `admin-${shortSeed || randomBytes(3).toString('hex')}`;
}

function makePasswordHash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

function passwordsMatch(input: string, storedHash: string): boolean {
  if (storedHash.startsWith('plain:')) {
    const expected = Buffer.from(storedHash.slice(6));
    const actual = Buffer.from(input);
    if (actual.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(actual, expected);
  }

  if (storedHash.startsWith('scrypt:')) {
    const [, salt, expectedHash] = storedHash.split(':');
    if (!salt || !expectedHash) {
      return false;
    }
    const actualHash = scryptSync(input, salt, 64).toString('hex');
    const actual = Buffer.from(actualHash, 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    if (actual.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(actual, expected);
  }

  return false;
}

function toIdentity(record: AdminRecord): AdminIdentity {
  return {
    id: record.id,
    role: record.role,
    name: record.name,
    email: record.email,
    phone: record.phone,
    createdAt: record.createdAt,
    createdByAdminId: record.createdByAdminId,
  };
}

function fromAdminRow(row: AdminRow): AdminRecord {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    createdByAdminId: row.created_by_admin_id,
  };
}

function fromSessionRow(row: AdminSessionRow): AdminSession {
  return {
    token: row.token,
    adminId: row.admin_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

function fromAuditRow(row: AdminAuditRow): AdminAuditEntry {
  return {
    id: row.id,
    at: row.at,
    action: row.action,
    status: row.status,
    actorId: row.actor_id,
    actorLabel: row.actor_label,
    summary: row.summary,
    target: row.target,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
  };
}

function getEnvFallbackSuperAdminRecord(): AdminRecord | null {
  const email = normaliseEmail(trimEnv(process.env.SUPER_ADMIN_EMAIL));
  const phone = normaliseAdminPhone(trimEnv(process.env.SUPER_ADMIN_PHONE));
  const password = trimEnv(process.env.SUPER_ADMIN_PASSWORD);

  if (!email || !password) {
    return null;
  }

  return {
    id: makeAdminId('super'),
    role: 'super_admin',
    name: trimEnv(process.env.SUPER_ADMIN_NAME) ?? 'Super Admin',
    email,
    phone,
    passwordHash: `plain:${password}`,
    createdAt: 'system',
    createdByAdminId: null,
  };
}

function compareAdminRecords(a: AdminRecord, b: AdminRecord) {
  if (a.role !== b.role) {
    return a.role === 'super_admin' ? -1 : 1;
  }

  return a.name.localeCompare(b.name);
}

async function getAllAdminRecords(): Promise<AdminRecord[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    const superAdmin = getEnvFallbackSuperAdminRecord();
    const team = Array.from(managedAdmins.values());
    return (superAdmin ? [superAdmin, ...team] : team).sort(compareAdminRecords);
  }

  const { data, error } = await supabase
    .from('admin_accounts')
    .select(ADMIN_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as AdminRow[]).map(fromAdminRow).sort(compareAdminRecords);
}

async function getSuperAdminRecord(): Promise<AdminRecord | null> {
  const admins = await getAllAdminRecords();
  return admins.find((admin) => admin.role === 'super_admin') ?? null;
}

async function getAdminByEmail(email: string): Promise<AdminRecord | null> {
  const normalizedEmail = normaliseEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const admins = await getAllAdminRecords();

  return admins.find((admin) => admin.email === normalizedEmail) ?? null;
}

export async function getConfiguredAdmin(): Promise<AdminIdentity | null> {
  const superAdmin = await getSuperAdminRecord();
  return superAdmin ? toIdentity(superAdmin) : null;
}

export async function listAdmins(): Promise<AdminIdentity[]> {
  const admins = await getAllAdminRecords();
  return admins.map(toIdentity);
}

export async function getAdminById(adminId: string): Promise<AdminIdentity | null> {
  const admins = await getAllAdminRecords();
  const admin = admins.find((record) => record.id === adminId);
  return admin ? toIdentity(admin) : null;
}

export async function isAdminConfigured(): Promise<boolean> {
  return (await getAllAdminRecords()).length > 0;
}

export function isSuperAdmin(admin: Pick<AdminIdentity, 'role'> | null | undefined): boolean {
  return admin?.role === 'super_admin';
}

export async function authenticateAdmin(email: string, password: string): Promise<{
  ok: boolean;
  admin?: AdminIdentity;
  error?: string;
}> {
  if (!(await isAdminConfigured())) {
    return {
      ok: false,
      error: 'Admin login is not configured. Create an active admin account in admin_accounts.',
    };
  }

  const admin = await getAdminByEmail(email);
  if (!admin) {
    return { ok: false, error: 'Invalid login details.' };
  }

  if (!passwordsMatch(password, admin.passwordHash)) {
    return { ok: false, error: 'Invalid login details.' };
  }

  return { ok: true, admin: toIdentity(admin) };
}

export async function createStaffAdmin(params: {
  name: string;
  phone?: string | null;
  email: string;
  password: string;
  createdByAdminId: string;
}): Promise<{ ok: boolean; admin?: AdminIdentity; error?: string }> {
  const name = params.name.trim();
  const password = params.password.trim();
  const phone = normaliseAdminPhone(params.phone ?? null);
  const email = normaliseEmail(params.email);

  if (!name) {
    return { ok: false, error: 'Admin name is required.' };
  }

  if (!email) {
    return { ok: false, error: 'A valid admin email is required.' };
  }

  if (!password) {
    return { ok: false, error: 'Admin password is required.' };
  }

  const allAdmins = await getAllAdminRecords();
  if (phone && allAdmins.some((admin) => admin.phone && admin.phone === phone)) {
    return { ok: false, error: 'That phone number is already in use by another admin.' };
  }

  if (allAdmins.some((admin) => admin.email && admin.email === email)) {
    return { ok: false, error: 'That email address is already in use by another admin.' };
  }

  const record: AdminRecord = {
    id: makeAdminId('admin', email),
    role: 'admin',
    name,
    email,
    phone,
    passwordHash: makePasswordHash(password),
    createdAt: new Date().toISOString(),
    createdByAdminId: params.createdByAdminId,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { error } = await supabase.from('admin_accounts').upsert(
      {
        id: record.id,
        role: record.role,
        name: record.name,
        email: record.email,
        phone: record.phone,
        password_hash: record.passwordHash,
        is_active: true,
        created_at: record.createdAt,
        created_by_admin_id: record.createdByAdminId,
      },
      { onConflict: 'id' }
    );

    if (error) {
      return { ok: false, error: error.message };
    }
  } else {
    managedAdmins.set(record.id, record);
  }

  return { ok: true, admin: toIdentity(record) };
}

function getTokenSecret(): string {
  return (
    trimEnv(process.env.ADMIN_SECRET) ??
    trimEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    'dev-fallback-secret-do-not-use-in-prod'
  );
}

function signedToken(adminId: string, expiresAt: string): string {
  const payload = `${adminId}|${expiresAt}`;
  const sig = createHmac('sha256', getTokenSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

function verifySignedToken(token: string): { adminId: string; expiresAt: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split('|');
    if (parts.length < 3) return null;
    const sig = parts[parts.length - 1];
    const payload = parts.slice(0, -1).join('|');
    const expectedSig = createHmac('sha256', getTokenSecret()).update(payload).digest('hex');
    if (sig !== expectedSig) return null;
    const [adminId, expiresAt] = payload.split('|');
    if (!adminId || !expiresAt) return null;
    return { adminId, expiresAt };
  } catch {
    return null;
  }
}

export async function createAdminSession(
  adminId: string,
  context?: { ipAddress?: string | null; userAgent?: string | null }
): Promise<AdminSession> {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setHours(expiresAt.getHours() + 12);

  const session: AdminSession = {
    token: signedToken(adminId, expiresAt.toISOString()),
    adminId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.from('admin_sessions').upsert(
      {
        token: session.token,
        admin_id: session.adminId,
        created_at: session.createdAt,
        expires_at: session.expiresAt,
        last_seen_at: session.createdAt,
        ip_address: context?.ipAddress ?? null,
        user_agent: context?.userAgent ?? null,
      },
      { onConflict: 'token' }
    );
  } else {
    adminSessions.set(session.token, session);
  }

  return session;
}

export async function getAdminSessionByToken(token: string): Promise<AdminSession | null> {
  const supabase = getSupabaseAdminClient();
  let session: AdminSession | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from('admin_sessions')
      .select('token, admin_id, created_at, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (!error && data) {
      session = fromSessionRow(data as AdminSessionRow);
    }
  } else {
    // First try the in-memory store (same process), then fall back to
    // verifying the self-contained signed token (survives hot reloads).
    session = adminSessions.get(token) ?? null;
    if (!session) {
      const verified = verifySignedToken(token);
      if (verified) {
        session = {
          token,
          adminId: verified.adminId,
          createdAt: new Date().toISOString(),
          expiresAt: verified.expiresAt,
        };
      }
    }
  }

  if (!session) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await destroyAdminSession(token);
    return null;
  }

  return session;
}

export async function getAdminContextByToken(token: string): Promise<{
  admin: AdminIdentity;
  session: AdminSession;
} | null> {
  const session = await getAdminSessionByToken(token);
  if (!session) {
    return null;
  }

  const admin = await getAdminById(session.adminId);
  if (!admin) {
    await destroyAdminSession(token);
    return null;
  }

  return { admin, session };
}

export async function destroyAdminSession(token: string) {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.from('admin_sessions').delete().eq('token', token);
    return;
  }

  adminSessions.delete(token);
}

export async function recordAdminAudit(entry: Omit<AdminAuditEntry, 'id' | 'at'>) {
  const auditEntry: AdminAuditEntry = {
    id: randomBytes(8).toString('hex'),
    at: new Date().toISOString(),
    ...entry,
  };

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    await supabase.from('admin_audit_logs').insert({
      id: auditEntry.id,
      at: auditEntry.at,
      action: auditEntry.action,
      status: auditEntry.status,
      actor_id: auditEntry.actorId,
      actor_label: auditEntry.actorLabel,
      summary: auditEntry.summary,
      target: auditEntry.target,
      ip_address: auditEntry.ipAddress,
      user_agent: auditEntry.userAgent,
    });
    return;
  }

  adminAuditTrail.unshift(auditEntry);

  if (adminAuditTrail.length > MAX_AUDIT_ENTRIES) {
    adminAuditTrail.length = MAX_AUDIT_ENTRIES;
  }
}

export async function getAdminAuditTrail(limit = 25): Promise<AdminAuditEntry[]> {
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('id, at, action, status, actor_id, actor_label, summary, target, ip_address, user_agent')
      .order('at', { ascending: false })
      .limit(limit);

    if (!error && data) {
      return (data as AdminAuditRow[]).map(fromAuditRow);
    }
  }

  return adminAuditTrail.slice(0, limit);
}
