// [HYP] Conversion from app.json to app.config.js for Expo config. [RES] The universe remains deterministic.
export default {
  expo: {
    name: "Gigbuds",
    slug: "gigbuds",
    version: "1.0.0",
    scheme: "gigbuds",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location.",
          locationAlwaysPermission:
            "Allow $(PRODUCT_NAME) to use your location.",
          locationWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location.",
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        "expo-secure-store",
        {
          configureAndroidBackup: true,
          faceIDPermission:
            "Allow $(PRODUCT_NAME) to access your Face ID biometric data.",
        },
      ],
    ],
    ios: {
      bundleIdentifier: "Gigbuds",
      buildNumber: "1.0.0",
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "This app uses location to find nearby job opportunities.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "This app uses location to find nearby job opportunities.",
      },
    },
    android: {
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
      versionCode: 1,
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "INTERNET",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.gigbuds.app",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      intentFilters: [
          {
            action: "VIEW",
            autoVerify: true,
            data: [
              {
                scheme: "gigbuds"
              }
            ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "ab0b9dff-febb-476b-97bf-c5d0279ee580"
      },
    },
    owner: "oranged_cat",
  },
};
