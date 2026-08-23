import type { NextConfig } from "next";

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

export default nextConfig;
