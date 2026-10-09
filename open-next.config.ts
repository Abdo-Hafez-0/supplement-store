import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache yet: pages that read D1 are dynamic. Add the R2
// incremental cache here if we start using ISR.
export default defineCloudflareConfig({});
