import { useEffect, useState } from "react";
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from "@capacitor-community/admob";
import { Capacitor } from "@capacitor/core";

interface AdMobBannerProps {
  position?: "top" | "bottom";
  size?: "banner" | "large" | "medium" | "full" | "smart";
}

export default function AdMobBanner({ 
  position = "bottom",
  size = "banner"
}: AdMobBannerProps) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  useEffect(() => {
    if (!isNative) return;

    const showBanner = async () => {
      try {
        const adSize = 
          size === "large" ? BannerAdSize.LARGE_BANNER :
          size === "medium" ? BannerAdSize.MEDIUM_RECTANGLE :
          size === "full" ? BannerAdSize.FULL_BANNER :
          size === "smart" ? BannerAdSize.SMART_BANNER :
          BannerAdSize.BANNER;

        const options: BannerAdOptions = {
          adId: "ca-app-pub-3940256099942544/6300978111", // Test banner ID
          adSize,
          position: position === "top" ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
          isTesting: true, // Set to false when using real Ad Unit IDs
        };

        await AdMob.showBanner(options);
      } catch (error) {
        console.error("Error showing banner ad:", error);
      }
    };

    showBanner();

    // Cleanup: hide banner when component unmounts
    return () => {
      if (isNative) {
        AdMob.hideBanner().catch(console.error);
      }
    };
  }, [isNative, position, size]);

  // Only show placeholder on web for development
  if (!isNative) {
    return (
      <div className="bg-slate-800 border-t border-slate-700 p-4 text-center text-slate-400 text-sm">
        <div className="max-w-md mx-auto">
          Ad Space (Shows in mobile app only)
        </div>
      </div>
    );
  }

  // On native, the ad is rendered by AdMob SDK, so return null
  return null;
}
