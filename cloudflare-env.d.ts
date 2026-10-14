declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    NETARZ_API_KEY?: string;
    AVALAI_API_KEY?: string;
    LIARA_API_KEY?: string;
    AI_PROVIDER?: string;
    AI_BASE_URL?: string;
    AI_MODEL?: string;
  }
}
