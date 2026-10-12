const expo = require("eslint-config-expo/flat");

module.exports = [...expo, { ignores: ["supabase/**", "docs/**", "coverage/**", "dist/**"] }];
