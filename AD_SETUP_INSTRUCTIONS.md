# NexusPlay - AdMob Setup Instructions

## 🎯 Ad Integration Complete!

Your app now has Google AdMob integrated and ready to generate revenue. Here's what has been set up:

### ✅ What's Installed
- **@capacitor-community/admob** plugin (v7.0.3)
- AdMob configuration in Android manifest
- Banner ad components on Dashboard and Game Library pages
- Interstitial ad system for app transitions
- Test ad units for development

---

## 📱 Ad Placements

### Banner Ads (Currently Active)
- **Dashboard Page**: Bottom banner
- **Game Library Page**: Bottom banner
- **Revenue**: $0.50-$2 per 1,000 views

### Interstitial Ads (Available to trigger)
- Full-page ads at natural app breaks
- **Revenue**: $3-$10 per 1,000 views
- Import `useInterstitialAd` to show ads programmatically

---

## 🚀 Getting Your AdMob Account

### Step 1: Create AdMob Account
1. Go to https://apps.admob.com
2. Sign in with your Google account
3. Click "Get Started" or "Add App"
4. Complete account setup (takes 24-48 hours for approval)

### Step 2: Create Your App in AdMob
1. In AdMob Console, click "Apps" → "Add App"
2. Select "Android"
3. Answer if app is listed on Play Store (say "No" if not yet published)
4. Enter app name: "NexusPlay"
5. Click "Add" - You'll get your **App ID**

### Step 3: Create Ad Units
Create these 3 ad units:

#### Banner Ad Unit
- Click your app → "Ad units" → "Add ad unit"
- Select "Banner"
- Name: "NexusPlay Banner"
- Copy the **Ad unit ID**

#### Interstitial Ad Unit
- Add ad unit → "Interstitial"
- Name: "NexusPlay Interstitial"
- Copy the **Ad unit ID**

#### Rewarded Video Ad Unit (Optional)
- Add ad unit → "Rewarded"
- Name: "NexusPlay Rewarded"
- Copy the **Ad unit ID**

---

## 🔧 Updating Your App with Real IDs

### Step 4: Replace Test IDs

Once you have your real AdMob IDs, replace them in these files:

#### 1. Android App ID
**File**: `android/app/src/main/res/values/strings.xml`
```xml
<!-- Replace this line: -->
<string name="admob_app_id">ca-app-pub-3940256099942544~3347511713</string>

<!-- With your real App ID: -->
<string name="admob_app_id">ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY</string>
```

#### 2. Ad Unit IDs
**File**: `client/src/utils/admob.ts`
```typescript
// Replace these with your real Ad Unit IDs:
export const AD_UNIT_IDS = {
  banner: "ca-app-pub-XXXXXXXXXXXXXXXX/1111111111",
  interstitial: "ca-app-pub-XXXXXXXXXXXXXXXX/2222222222",
  rewarded: "ca-app-pub-XXXXXXXXXXXXXXXX/3333333333",
};
```

#### 3. Update Banner Component
**File**: `client/src/components/ads/admob-banner.tsx` (line 26)
```typescript
// Change:
adId: "ca-app-pub-3940256099942544/6300978111", // Test banner ID
isTesting: true,

// To:
adId: AD_UNIT_IDS.banner, // Your real banner ID
isTesting: false,
```

#### 4. Update Interstitial Component
**File**: `client/src/components/ads/admob-interstitial.tsx` (line 37)
```typescript
// Change:
adId: "ca-app-pub-3940256099942544/1033173712", // Test interstitial ID
isTesting: true,

// To:
adId: AD_UNIT_IDS.interstitial, // Your real interstitial ID
isTesting: false,
```

#### 5. Update AdMob Initialization
**File**: `client/src/utils/admob.ts` (line 13)
```typescript
// Change:
initializeForTesting: true, // Remove in production

// To:
initializeForTesting: false,
```

---

## 💡 Adding More Ads

### Show Interstitial Ads at Key Moments

Add this to any component where you want to show an interstitial ad:

```typescript
import { useInterstitialAd } from "@/components/ads/admob-interstitial";

function MyComponent() {
  const { showAd, preloadAd } = useInterstitialAd();
  
  // Preload ad when component mounts
  useEffect(() => {
    preloadAd();
  }, []);
  
  // Show ad when appropriate (e.g., after completing a task)
  const handleTaskComplete = () => {
    // Do your task completion logic
    completeTask();
    
    // Then show ad
    showAd();
  };
}
```

### Good Times to Show Interstitial Ads:
- After completing a game/task
- When navigating between major sections
- After 3-5 minutes of usage
- When opening/closing detailed views
- **Don't spam**: Show max 1 ad every 3-5 minutes

---

## 📊 Expected Revenue

### Typical Earnings (varies by region and engagement):
- **1,000 active users/month**: $10-50/month
- **10,000 active users/month**: $100-500/month
- **100,000 active users/month**: $1,000-5,000/month

### Maximizing Revenue:
1. Use both banner AND interstitial ads
2. Show interstitials at natural app breaks
3. Target users in high-CPM countries (US, UK, Canada)
4. Maintain good user retention
5. Consider adding rewarded video ads for optional rewards

---

## ⚠️ Important Notes

### Before Publishing:
- [ ] Replace ALL test Ad Unit IDs with real ones
- [ ] Set `isTesting: false` in all ad components
- [ ] Set `initializeForTesting: false` in admob.ts
- [ ] Test ads on real device (test ads won't show in emulator)
- [ ] Run `npx cap sync android` after making changes

### AdMob Policies:
- Don't click your own ads (will get banned)
- Don't ask users to click ads
- Don't show ads on splash/loading screens
- Follow Google's ad placement policies
- Don't show ads on error/warning screens

### Testing Your Setup:
1. Build your app: `npm run build && npx cap sync android`
2. Open in Android Studio: `npx cap open android`
3. Run on real device (not emulator)
4. Test ads will show with "Test Ad" label
5. Real ads show after replacing IDs and publishing

---

## 🎉 You're All Set!

Your app is now monetization-ready! Once you:
1. Get your AdMob account approved
2. Create your app and ad units
3. Replace the test IDs with real ones
4. Publish to Play Store

You'll start earning revenue from your user base!

### Next Steps:
1. Create AdMob account today (approval takes 24-48 hours)
2. While waiting, finish your Play Store submission
3. Replace IDs before final publication
4. Monitor revenue in AdMob console

**Questions?** Check [AdMob Help Center](https://support.google.com/admob) or review the code comments in the ad components.
