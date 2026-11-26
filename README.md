# Food Calc

Calories of what you eat, from the barcode on the package: scan it (or type it), say how much you ate, see
the total of the day. Product data come from [Open Food Facts](https://world.openfoodfacts.org) through the
small API in [food-calc-backend](https://github.com/RR2000/food-calc-backend).

Demo: https://kcal.raoulrondinella.dev - it starts empty; on a phone tap "Scan with the camera" and allow
the camera, on a PC type a barcode or try one of the sample products.

## What it does

- **Scan**: the camera reads EAN-13, EAN-8, UPC-A and UPC-E. On the web it uses the browser camera
  (HTTPS and the user's permission) with the browser's own `BarcodeDetector` where there is one, otherwise
  [ZXing](https://github.com/zxing-js/library) in JavaScript, loaded only when the camera starts. The camera
  starts only on a tap and stops after a read, or when the page goes in the background. Without a camera, or
  with the permission denied, the barcode can be typed.
- **Product**: name, brand, kcal and nutrients per 100 g (100 ml for drinks).
- **How much**: one tap for 50 / 100 / 150 / 200 g or the whole package, or any amount.
- **Today**: what was eaten today with kcal, protein, carbs and fat; items can be removed.
- The diary stays on the device (local storage, last 30 days): no account, nothing kept on the server.
- English or Italian, following the device language; light and dark theme.

## Stack

Expo SDK 58 (React Native 0.88, React 19.3) for web, Android and iOS; `expo-camera` on the phone builds.
Tests with Jest (`jest-expo`).

## Run

```bash
npm ci
npm test
npm run typecheck
EXPO_PUBLIC_API_URL=http://localhost:8080 npm run web   # with the API running on :8080
npm run build                                          # static web app in dist/
```

On the web the API is expected on the same origin (`/api`); a phone build uses the demo API unless
`EXPO_PUBLIC_API_URL` says otherwise.

## Image

The CI publishes `ghcr.io/rr2000/food-calc-app:main` (and `:sha-<commit>`) at every push on `main` (during the
rename the same tags also go under the old name `ghcr.io/rr2000/foodcalcfe`): nginx with
the web app on `/` and `/api` passed to the service `api` on port 8080 (the backend image).
