import { AdMob } from "@capacitor-community/admob";
import { Capacitor } from "@capacitor/core";

/**
 * Initialize AdMob
 * Call this once when the app starts
 */
export async function initializeAdMob() {
  if (!Capacitor.isNativePlatform()) {
    console.log("AdMob only available on native platforms");
    return;
  }

  try {
    await AdMob.initialize({
      requestTrackingAuthorization: true,
      initializeForTesting: true, // Remove in production
    });
    console.log("AdMob initialized successfully");
  } catch (error) {
    console.error("Failed to initialize AdMob:", error);
  }
}

/**
 * Ad Unit IDs
 * Replace these with your actual Ad Unit IDs from AdMob console
 * Current IDs are Google's test IDs
 */
export const AD_UNIT_IDS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
};

/**
 * IMPORTANT: Before publishing to Play Store
 * 
 * 1. Get your AdMob App ID from https://apps.admob.com
 * 2. Replace the test ID in android/app/src/main/res/values/strings.xml
 * 3. Create Ad Units in AdMob console for each ad type
 * 4. Replace the test IDs above with your real Ad Unit IDs
 * 5. Set isTesting: false in all ad components
 */
