// JS side of the local WalletPass module. In Expo Go (no native module) every check returns false,
// so the "Add to Apple Wallet" button is simply shown.
import { requireOptionalNativeModule } from "expo";

type Native = { isAvailable(): boolean; hasPass(passTypeIdentifier: string, serialNumber: string): boolean };
const native = requireOptionalNativeModule<Native>("WalletPass");

export const PASS_TYPE_ID = "pass.am.smartcontacts.card";

/** True when the card with this serial (= user id, see apps/web/api/wallet.js) is already in Wallet. */
export function hasSmartContactsPass(userId: string): boolean {
  try {
    return native?.hasPass(PASS_TYPE_ID, userId) ?? false;
  } catch {
    return false;
  }
}
