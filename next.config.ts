import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
    transpilePackages: ["firebase-admin"],
    sassOptions: {
        silenceDeprecations: [
            "legacy-js-api",
            "import",
            "global-builtin",
            "color-functions",
        ],
        quietDeps: true,
    },
};

export default withPWA(nextConfig);
