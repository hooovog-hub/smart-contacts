// Invites (spec: docs/01-product/features/invites.md): 10 friends with a filled profile = +1 month Pro.
// A link smartcontacts://i/<code> (or https://smart-contacts.vercel.app/i/<code>) stores the code until the
// new user creates a profile; onboarding then links the invite once (table profile_invites, owner-only).
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SITE_URL } from "./config";
import { supabase } from "./supabase";

const KEY = "pending_invite_code";
export const INVITES_PER_REWARD = 10;

/** Extracts an invite code from a deep link or web link. */
export function inviteCodeFromUrl(url: string | null | undefined): string | null {
  const m = (url ?? "").match(/\/i\/([A-Za-z0-9]{4,32})(?:[/?#]|$)/);
  return m ? m[1].toLowerCase() : null;
}

export async function rememberInvite(url: string | null | undefined) {
  const code = inviteCodeFromUrl(url);
  if (code) await AsyncStorage.setItem(KEY, code).catch(() => undefined);
}

export async function pendingInvite(): Promise<string | null> {
  return AsyncStorage.getItem(KEY).catch(() => null);
}

/** Links the new profile to the inviter. Silent on failure: a wrong code must never block sign-up. */
export async function applyInvite(profileId: string, code: string | null) {
  const c = code?.trim().toLowerCase();
  if (!c) return;
  try {
    const { data } = await supabase.from("profiles").select("id").eq("invite_code", c).maybeSingle();
    if (data?.id && data.id !== profileId)
      await supabase.from("profile_invites").insert({ profile_id: profileId, invited_by: data.id });
  } finally {
    await AsyncStorage.removeItem(KEY).catch(() => undefined);
  }
}

export const inviteLink = (code: string) => `${SITE_URL}/i/${code}`;

export function inviteMessage(name: string, code: string) {
  return `Привет! Я пользуюсь Smart Contacts — умной записной книжкой для бизнеса: AI подсказывает, кто из знакомых поможет. Присоединяйся: ${inviteLink(code)}\n— ${name}`;
}

export type InviteStats = { joined: number; counted: number; rewards: number };

export async function myInviteStats(): Promise<InviteStats> {
  const { data } = await supabase.rpc("my_invite_stats");
  const row = (Array.isArray(data) ? data[0] : data) as InviteStats | undefined;
  return row ?? { joined: 0, counted: 0, rewards: 0 };
}
