import ExpoModulesCore
import PassKit

// Is the user's Smart Contacts card already in Apple Wallet? The app can only see passes whose type is listed
// in its `com.apple.developer.pass-type-identifiers` entitlement (app.json → ios.entitlements).
public class WalletPassModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WalletPass")

    Function("isAvailable") { () -> Bool in
      return PKPassLibrary.isPassLibraryAvailable()
    }

    Function("hasPass") { (passTypeIdentifier: String, serialNumber: String) -> Bool in
      guard PKPassLibrary.isPassLibraryAvailable() else { return false }
      return PKPassLibrary().pass(withPassTypeIdentifier: passTypeIdentifier, serialNumber: serialNumber) != nil
    }
  }
}
