import { cookies } from "next/headers";

const COOKIE_NAME = "admin_auth";

export async function isAdminAuthed() {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value === "1";
}

export async function setAdminAuthed() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAdminAuthed() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

