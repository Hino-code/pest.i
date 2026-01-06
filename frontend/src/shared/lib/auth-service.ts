import {
  AppUser,
  AuthSession,
  LoginPayload,
  PendingUser,
  RegistrationPayload,
} from "@/shared/types/user";

const defaultUsers: Array<AppUser & { password: string }> = [
  {
    id: "user-admin",
    username: "System Administrator",
    email: "admin@ews.local",
    role: "Administrator",
    status: "approved",
    password: "admin123",
  },
  {
    id: "user-demo",
    username: "Demo User",
    email: "demo@ews.local",
    role: "Demo User",
    status: "approved",
    password: "demo123",
  },
  {
    id: "user-field",
    username: "Field Manager",
    email: "field@ews.local",
    role: "Field Manager",
    status: "approved",
    password: "field123",
  },
];

let approvedUsers = [...defaultUsers];
let pendingUsers: PendingUser[] = [
  {
    id: "pending-1",
    name: "Jane Researcher",
    email: "jane@agency.gov",
    agency: "DA Region XII",
    role: "Researcher",
    submittedAt: new Date().toISOString(),
  },
];

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const createToken = (userId: string) =>
  `mock-token-${userId}-${Date.now().toString(36)}`;

export async function mockLogin(payload: LoginPayload): Promise<AuthSession> {
  await delay();
  const match = approvedUsers.find(
    (user) =>
      user.email.toLowerCase() === payload.username.toLowerCase() &&
      user.password === payload.password,
  );

  if (!match) {
    throw new Error("Invalid credentials or account not approved");
  }

  return {
    token: createToken(match.id),
    user: {
      id: match.id,
      username: match.username,
      email: match.email,
      role: match.role,
      status: match.status,
    },
  };
}

export async function mockRegister(
  payload: RegistrationPayload,
): Promise<{ pendingId: string }> {
  await delay();
  const pendingId =
    globalThis.crypto?.randomUUID?.() ?? `pending-${Date.now().toString(36)}`;
  pendingUsers.push({
    id: pendingId,
    name: payload.name,
    email: payload.email,
    agency: payload.agency,
    role: payload.role,
    submittedAt: new Date().toISOString(),
  });
  return { pendingId };
}

export async function mockListPendingUsers(): Promise<PendingUser[]> {
  await delay();
  return pendingUsers;
}

export async function mockApproveUser(userId: string): Promise<void> {
  await delay();
  const pending = pendingUsers.find((user) => user.id === userId);
  if (!pending) {
    throw new Error("Pending user not found");
  }
  pendingUsers = pendingUsers.filter((user) => user.id !== userId);
  approvedUsers.push({
    id: `user-${userId}`,
    username: pending.name,
    email: pending.email,
    role: pending.role,
    status: "approved",
    password: "changeme",
  });
}

export async function mockRejectUser(userId: string): Promise<void> {
  await delay();
  const exists = pendingUsers.some((user) => user.id === userId);
  if (!exists) throw new Error("Pending user not found");
  pendingUsers = pendingUsers.filter((user) => user.id !== userId);
}

export async function mockLoadSession(token: string | null) {
  await delay(100);
  if (!token) return null;
  const [, userId] = token.split("mock-token-");
  const user = approvedUsers.find((u) => token.includes(u.id));
  if (!user) return null;
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
}

