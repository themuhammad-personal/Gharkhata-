# ঘরখাতা (Ghorkhata) — Android অ্যাপ

বাংলা ভাষার সংসারের হিসাব-নিকাশের অ্যাপ। HTML/CSS/JS দিয়ে তৈরি অ্যাপটি একটি নেটিভ Android WebView-এ চলে। সব ডেটা ফোনের ভেতরেই (localStorage) সংরক্ষিত থাকে — ইন্টারনেট ছাড়াই ব্যবহার করা যায়।

> **গুরুত্বপূর্ণ:** APK বিল্ডের workflow ফাইলটি রিপোজিটরির **রুটে** `.github/workflows/build-apk.yml` পাথে থাকতে হবে। GitHub শুধুমাত্র রুটের `.github/workflows/` ফোল্ডার থেকে Actions চালায় — অন্য কোনো সাব-ফোল্ডারে রাখলে Action চলবে না।

## APK বিল্ড করার নিয়ম (GitHub Release দিয়ে)

### ধাপ ১: কোড GitHub-এ পুশ করুন

রিপোজিটরির কাঠামো এমন হবে:

```
আপনার-রিপো/
├── .github/workflows/build-apk.yml   ← workflow (অবশ্যই রুটে)
└── android/                          ← Android প্রজেক্ট
    ├── app/...
    ├── build.gradle
    ├── settings.gradle
    └── gradle.properties
```

Zip ফাইলটি extract করে সেই ফোল্ডারে টার্মিনাল খুলে চালান:

```bash
git init
git add .
git commit -m "Ghorkhata Android app"
git branch -M main
git remote add origin https://github.com/আপনার-ইউজারনেম/ghorkhata.git
git push -u origin main
```

### ধাপ ২: ট্যাগ পুশ করে বিল্ড শুরু করুন

```bash
git tag v1.0.1
git push origin v1.0.1
```

ট্যাগ পুশ করার সাথে সাথেই GitHub Actions স্বয়ংক্রিয়ভাবে APK বিল্ড করে একটি **Release** তৈরি করবে (৩-৫ মিনিট লাগে)।

> **লক্ষ্য করুন:** কোনো ট্যাগ আগেই পুশ করা থাকলে (যেমন `v1.0.0`) সেটি আবার ব্যবহার করা যাবে না — নতুন নম্বরের ট্যাগ দিন (যেমন `v1.0.1`)।

### ধাপ ৩: ফোনে ইন্সটল করুন

1. রিপোজিটরির **Releases** পেজে যান।
2. `Ghorkhata-v1.0.1.apk` ফাইলটি ফোনে ডাউনলোড করুন।
3. ফাইলটি খুলে ইন্সটল করুন। ("অজানা উৎস থেকে ইন্সটল" অনুমতি চাইলে Allow করুন।)

### ট্যাগ ছাড়া ম্যানুয়ালি বিল্ড করা

রিপোজিটরির **Actions** ট্যাব → বাম পাশে **"Build Android APK"** → ডান পাশে **"Run workflow"** বাটন চাপুন। বিল্ড শেষে ওই run-এর পেজের নিচে **Artifacts** অংশ থেকে APK ডাউনলোড করা যাবে।

## Action ব্যর্থ হলে যা দেখবেন

1. **Actions ট্যাবে কোনো run-ই আসছে না?** → workflow ফাইলটি `.github/workflows/` (রিপোর রুটে) আছে কিনা দেখুন।
2. **Run হয়েছে কিন্তু লাল (failed)?** → run-টি খুলে কোন step-এ error হয়েছে দেখুন। "Build release APK" step-এর লগে আসল কারণ থাকবে।
3. **Release তৈরি হয়নি?** → Release শুধু **ট্যাগ পুশ** করলে তৈরি হয়; ম্যানুয়াল run-এ APK শুধু Artifacts-এ পাওয়া যায়।
4. রিপোজিটরির **Settings → Actions → General → Workflow permissions**-এ **"Read and write permissions"** নির্বাচিত আছে কিনা নিশ্চিত করুন (Release তৈরির জন্য দরকার)।

## নতুন ভার্সন রিলিজ করা

1. `android/app/src/main/assets/index.html` ফাইলে পরিবর্তন করুন (এই রিপোতে `public/ghorkhata.html` থাকলে workflow নিজেই সেটি সিঙ্ক করে নেয়)।
2. `android/app/build.gradle`-এ `versionCode` (১ বাড়ান) ও `versionName` আপডেট করুন।
3. কমিট করে নতুন ট্যাগ পুশ করুন:

```bash
git add .
git commit -m "Update app"
git tag v1.0.2
git push origin main v1.0.2
```

## দ্রষ্টব্য

- APK-টি debug key দিয়ে সাইন করা, তাই সরাসরি ফোনে ইন্সটল করা যাবে কিন্তু Google Play Store-এ আপলোড করা যাবে না। Play Store-এ দিতে চাইলে নিজস্ব keystore দিয়ে সাইন করতে হবে।
- ফন্ট (Hind Siliguri) Google Fonts থেকে লোড হয়, তাই প্রথমবার ইন্টারনেট থাকলে ফন্ট সুন্দর দেখাবে; ইন্টারনেট না থাকলেও অ্যাপ সম্পূর্ণ কাজ করবে।
- অ্যাপ আনইন্সটল করলে সব হিসাবের ডেটা মুছে যাবে।
