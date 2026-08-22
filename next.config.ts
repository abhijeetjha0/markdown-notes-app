import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    silenceDeprecations: ['legacy-js-api', 'import', 'global-builtin', 'color-functions'],
    quietDeps: true,
  }
};

export default nextConfig;
