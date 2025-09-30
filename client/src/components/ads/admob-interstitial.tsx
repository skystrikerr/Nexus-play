import { AdMob, AdOptions, InterstitialAdPluginEvents, AdMobError } from "@capacitor-community/admob";
import { Capacitor } from "@capacitor/core";

class InterstitialAdManager {
  private isLoaded = false;
  private isLoading = false;
  private listeners: Array<() => void> = [];

  constructor() {
    if (Capacitor.isNativePlatform()) {
      this.setupListeners();
    }
  }

  private setupListeners() {
    AdMob.addListener(InterstitialAdPluginEvents.Loaded, () => {
      this.isLoaded = true;
      this.isLoading = false;
      console.log("Interstitial ad loaded");
    });

    AdMob.addListener(InterstitialAdPluginEvents.FailedToLoad, (error: AdMobError) => {
      this.isLoaded = false;
      this.isLoading = false;
      console.error("Failed to load interstitial ad:", error);
    });

    AdMob.addListener(InterstitialAdPluginEvents.Showed, () => {
      console.log("Interstitial ad shown");
    });

    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      this.isLoaded = false;
      console.log("Interstitial ad dismissed");
      // Preload next ad
      this.preload();
    });
  }

  async preload() {
    if (!Capacitor.isNativePlatform() || this.isLoading || this.isLoaded) {
      return;
    }

    this.isLoading = true;

    const options: AdOptions = {
      adId: "ca-app-pub-3940256099942544/1033173712", // Test interstitial ID
      isTesting: true, // Set to false when using real Ad Unit IDs
    };

    try {
      await AdMob.prepareInterstitial(options);
    } catch (error) {
      console.error("Error preloading interstitial ad:", error);
      this.isLoading = false;
    }
  }

  async show() {
    if (!Capacitor.isNativePlatform()) {
      console.log("Interstitial ad only available on mobile");
      return;
    }

    if (!this.isLoaded) {
      console.log("Interstitial ad not ready yet");
      await this.preload();
      return;
    }

    try {
      await AdMob.showInterstitial();
    } catch (error) {
      console.error("Error showing interstitial ad:", error);
    }
  }
}

// Singleton instance
export const interstitialAd = new InterstitialAdManager();

// Hook for easy usage in components
export function useInterstitialAd() {
  const showAd = () => interstitialAd.show();
  const preloadAd = () => interstitialAd.preload();

  return { showAd, preloadAd };
}
