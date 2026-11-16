import { FunctionsHttpError } from "@supabase/supabase-js";
import { getAppleAuthorizationCode } from "./appleAuth";
import { supabase } from "./supabase";

// Must match DELETE_CONFIRMATION in supabase/functions/_shared/account.ts
const DELETE_CONFIRMATION = "DELETE_MY_ACCOUNT";

/**
 * Permanently deletes the signed-in account on the server, then clears the local session.
 * Returns false if the user cancelled the Apple confirmation sheet. Throws on failure.
 */
export async function deleteAccount(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  const usesApple = data.session?.user.identities?.some((i) => i.provider === "apple") ?? false;

  // Apple users confirm with Face ID; the fresh code lets the server revoke Apple tokens (Apple requirement).
  let appleAuthorizationCode: string | undefined;
  if (usesApple) {
    const code = await getAppleAuthorizationCode();
    if (code === null) return false; // cancelled
    appleAuthorizationCode = code;
  }

  const { error } = await supabase.functions.invoke("delete-account", {
    body: { confirm: DELETE_CONFIRMATION, appleAuthorizationCode },
  });
  if (error) {
    // 401 may mean the account is already gone (a retry after a lost response). Confirm with the server.
    const is401 = error instanceof FunctionsHttpError && (error.context as Response)?.status === 401;
    const stillExists = is401 ? !!(await supabase.auth.getUser()).data.user : true;
    if (stillExists) throw error;
  }
  await supabase.auth.signOut({ scope: "local" });
  return true;
}
