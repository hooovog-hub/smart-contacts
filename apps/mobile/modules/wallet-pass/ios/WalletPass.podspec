Pod::Spec.new do |s|
  s.name           = 'WalletPass'
  s.version        = '1.0.0'
  s.summary        = 'Checks whether the BeContact card is already in Apple Wallet'
  s.description    = 'Local Expo module: PKPassLibrary lookup by pass type identifier and serial number.'
  s.license        = 'UNLICENSED'
  s.author         = 'BeContact'
  s.homepage       = 'https://becontact.app'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'PassKit'
  s.source_files   = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
