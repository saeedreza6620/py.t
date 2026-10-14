import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const users = sqliteTable('users', {
  userId: text('user_id').primaryKey(), email: text('email').notNull(),
  profile: text('profile_json').notNull().default('{}'), wallet: text('wallet_json').notNull().default('[]'),
  routine: text('routine_json').notNull().default('{}'), adminConsent: integer('admin_consent').notNull().default(0),
  updatedAt: text('updated_at').notNull(),
});
export const phoneProfiles = sqliteTable('phone_profiles', {
  phone: text('phone').primaryKey(), profile: text('profile_json').notNull().default('{}'),
  wallet: text('wallet_json').notNull().default('[]'), routine: text('routine_json').notNull().default('{}'),
  regret: text('regret_json').notNull().default('{}'),
  tracking: text('tracking_json').notNull().default('{}'),
  supplements: text('supplements_json').notNull().default('{}'),
  budget: text('budget_json').notNull().default('{}'),
  adminConsent: integer('admin_consent').notNull().default(0), updatedAt: text('updated_at').notNull(),
});
export const phoneOtps = sqliteTable('phone_otps', {
  phone: text('phone').primaryKey(), codeHash: text('code_hash').notNull(), expiresAt: integer('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0), nextSendAt: integer('next_send_at').notNull(),
  sendCount: integer('send_count').notNull().default(1), windowStart: integer('window_start').notNull(),
});
export const phoneSessions = sqliteTable('phone_sessions', {
  tokenHash: text('token_hash').primaryKey(), phone: text('phone').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
export const otpIpLimits = sqliteTable('otp_ip_limits', {
  ipHash: text('ip_hash').primaryKey(), sendCount: integer('send_count').notNull().default(1),
  windowStart: integer('window_start').notNull(),
});
export const profileHistory = sqliteTable('profile_history', {
  id: integer('id').primaryKey({autoIncrement:true}),
  phone: text('phone').notNull(),
  profile: text('profile_json').notNull(),
  wallet: text('wallet_json').notNull(),
  routine: text('routine_json').notNull(),
  regret: text('regret_json').notNull().default('{}'),
  tracking: text('tracking_json').notNull().default('{}'),
  supplements: text('supplements_json').notNull().default('{}'),
  budget: text('budget_json').notNull().default('{}'),
  recordedAt: text('recorded_at').notNull(),
});
export const visitorSessions = sqliteTable('visitor_sessions', {
  tokenHash: text('token_hash').primaryKey(),
  phone: text('phone').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
export const routineReminders = sqliteTable('routine_reminders', {
  userId: text('user_id').primaryKey(),
  enabled: integer('enabled').notNull().default(0),
  morningTime: text('morning_time').notNull().default('08:00'),
  eveningTime: text('evening_time').notNull().default('21:00'),
  startedAt: text('started_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
export const routineReviews = sqliteTable('routine_reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  day: integer('day').notNull(),
  status: text('status').notNull(),
  note: text('note').notNull().default(''),
  recordedAt: text('recorded_at').notNull(),
}, (t) => [index('routine_reviews_user_recorded_idx').on(t.userId,t.recordedAt)]);
export const recoveryKeys = sqliteTable('recovery_keys', {
  keyHash: text('key_hash').primaryKey(),
  phone: text('phone').notNull().unique(),
  createdAt: text('created_at').notNull(),
});
export const recoveryLimits = sqliteTable('recovery_limits', {
  ipHash: text('ip_hash').primaryKey(),
  attempts: integer('attempts').notNull().default(1),
  windowStart: integer('window_start').notNull(),
});
export const adminLoginLimits = sqliteTable('admin_login_limits', {
  ipHash: text('ip_hash').primaryKey(),
  attempts: integer('attempts').notNull().default(1),
  windowStart: integer('window_start').notNull(),
});
export const assistantMessages = sqliteTable('assistant_messages', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(),
  content: text('content').notNull(),
  meta: text('meta_json').notNull().default('{}'),
  createdAt: text('created_at').notNull(),
}, (t) => [index('assistant_messages_user_created_idx').on(t.userId, t.createdAt)]);
export const assistantMarketMemory = sqliteTable('assistant_market_memory', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  productName: text('product_name').notNull().default(''),
  seller: text('seller').notNull().default(''),
  price: text('price').notNull().default(''),
  discount: text('discount_text').notNull().default(''),
  availability: text('availability').notNull().default(''),
  installment: text('installment').notNull().default(''),
  productUrl: text('product_url').notNull().default(''),
  capturedAt: text('captured_at').notNull(),
  source: text('source').notNull().default('user_supplied'),
}, (t) => [index('assistant_market_user_captured_idx').on(t.userId, t.capturedAt)]);
export const assistantRateLimits = sqliteTable('assistant_rate_limits', {
  scopeHash: text('scope_hash').primaryKey(),
  requestCount: integer('request_count').notNull().default(1),
  windowStart: integer('window_start').notNull(),
});

// Provider-reported tokens, stored per anonymous visitor; no API keys or message text.
export const assistantUsage = sqliteTable('assistant_usage', {
  id: text('id').primaryKey(), userId: text('user_id').notNull(),
  messageId: text('message_id').notNull().unique(), model: text('model').notNull(),
  tier: text('tier').notNull(), inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  webSearch: integer('web_search').notNull().default(0),
  estimatedModelToman: integer('estimated_model_toman'),
  createdAt: text('created_at').notNull(),
}, (t) => [index('assistant_usage_user_created_idx').on(t.userId,t.createdAt)]);

export const assistantKnowledgeSources = sqliteTable('assistant_knowledge_sources', {
  sourceId: text('source_id').primaryKey(),
  title: text('title').notNull(),
  publisher: text('publisher').notNull(),
  sourceType: text('source_type').notNull(),
  url: text('url').notNull(),
  region: text('region').notNull().default('global'),
  evidenceLevel: text('evidence_level').notNull(),
  topics: text('topics_json').notNull().default('[]'),
  summary: text('summary').notNull(),
  publishedAt: text('published_at'),
  checkedAt: text('checked_at').notNull(),
  expiresAt: text('expires_at'),
  status: text('status').notNull().default('draft'),
  contentFingerprint: text('content_fingerprint').notNull().default(''),
  version: text('version').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [
  index('assistant_knowledge_sources_status_checked_idx').on(t.status, t.checkedAt),
]);

export const assistantKnowledgeRules = sqliteTable('assistant_knowledge_rules', {
  ruleId: text('rule_id').primaryKey(),
  ruleKey: text('rule_key').notNull(),
  version: integer('version').notNull(),
  title: text('title').notNull(),
  triggerTerms: text('trigger_terms_json').notNull().default('[]'),
  conditions: text('conditions_json').notNull().default('{}'),
  recommendation: text('recommendation').notNull(),
  safetyLevel: text('safety_level').notNull().default('guidance'),
  evidenceLevel: text('evidence_level').notNull(),
  sourceIds: text('source_ids_json').notNull().default('[]'),
  status: text('status').notNull().default('draft'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: text('reviewed_at'),
  validFrom: text('valid_from').notNull(),
  expiresAt: text('expires_at'),
  supersededBy: text('superseded_by'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [
  index('assistant_knowledge_rules_status_valid_idx').on(t.status, t.validFrom),
  index('assistant_knowledge_rules_key_version_idx').on(t.ruleKey, t.version),
]);

export const assistantKnowledgeReleases = sqliteTable('assistant_knowledge_releases', {
  version: text('version').primaryKey(),
  status: text('status').notNull(),
  sourceIds: text('source_ids_json').notNull().default('[]'),
  ruleIds: text('rule_ids_json').notNull().default('[]'),
  notes: text('notes').notNull().default(''),
  publishedAt: text('published_at'),
  createdAt: text('created_at').notNull(),
});

export const assistantProducts = sqliteTable('assistant_products', {
  productId: text('product_id').primaryKey(),
  gtin: text('gtin'),
  irc: text('irc'),
  brand: text('brand').notNull(),
  nameFa: text('name_fa').notNull(),
  nameEn: text('name_en').notNull().default(''),
  variant: text('variant').notNull().default(''),
  volume: text('volume').notNull().default(''),
  category: text('category').notNull().default(''),
  inci: text('inci_json').notNull().default('[]'),
  sourceId: text('source_id'),
  verificationStatus: text('verification_status').notNull().default('pending'),
  verifiedAt: text('verified_at'),
  updatedAt: text('updated_at').notNull(),
}, (t) => [
  index('assistant_products_gtin_idx').on(t.gtin),
  index('assistant_products_irc_idx').on(t.irc),
  index('assistant_products_status_idx').on(t.verificationStatus),
]);

export const assistantVerifiedOffers = sqliteTable('assistant_verified_offers', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull(),
  seller: text('seller').notNull(),
  cashPrice: integer('cash_price'),
  discountPrice: integer('discount_price'),
  stockStatus: text('stock_status').notNull(),
  shippingCost: integer('shipping_cost'),
  downPayment: integer('down_payment'),
  installmentCount: integer('installment_count'),
  installmentAmount: integer('installment_amount'),
  totalFee: integer('total_fee'),
  finalInstallmentCost: integer('final_installment_cost'),
  directProductUrl: text('direct_product_url').notNull(),
  sourceType: text('source_type').notNull(),
  sourceId: text('source_id'),
  observedAt: text('observed_at').notNull(),
  expiresAt: text('expires_at').notNull(),
  verificationStatus: text('verification_status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
}, (t) => [
  index('assistant_offers_product_status_expiry_idx').on(t.productId, t.verificationStatus, t.expiresAt),
]);

export const assistantDecisions = sqliteTable('assistant_decisions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  assistantMessageId: text('assistant_message_id').notNull(),
  intent: text('intent').notNull(),
  decision: text('decision').notNull(),
  explanation: text('explanation').notNull().default(''),
  knowledgeVersion: text('knowledge_version').notNull(),
  sourceIds: text('source_ids_json').notNull().default('[]'),
  marketSnapshot: text('market_snapshot_json').notNull().default('{}'),
  confidence: text('confidence').notNull().default('low'),
  missingData: text('missing_data_json').notNull().default('[]'),
  profileUpdatedAt: text('profile_updated_at'),
  userAction: text('user_action').notNull().default(''),
  outcomeStatus: text('outcome_status').notNull().default(''),
  updatedAt: text('updated_at').notNull().default(''),
  createdAt: text('created_at').notNull(),
}, (t) => [
  index('assistant_decisions_user_created_idx').on(t.userId, t.createdAt),
]);

export const assistantFeedback = sqliteTable('assistant_feedback', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  assistantMessageId: text('assistant_message_id').notNull(),
  rating: text('rating').notNull(),
  outcome: text('outcome').notNull().default(''),
  note: text('note').notNull().default(''),
  adverseSignal: integer('adverse_signal').notNull().default(0),
  createdAt: text('created_at').notNull(),
}, (t) => [
  index('assistant_feedback_user_created_idx').on(t.userId, t.createdAt),
  index('assistant_feedback_message_idx').on(t.assistantMessageId),
]);

// Anonymous, idempotent installation reports. No profile or device identifier is stored.
export const installReports = sqliteTable('install_reports', {
  receiptId: text('receipt_id').primaryKey(),
  platform: text('platform').notNull(),
  createdAt: text('created_at').notNull(),
});

// Experiences are never promoted to verified product facts or scientific rules.
export const skinForumPosts = sqliteTable('skin_forum_posts', {
  id: text('id').primaryKey(),
  parentId: text('parent_id'),
  authorHash: text('author_hash').notNull(),
  productId: text('product_id').notNull().default(''),
  productName: text('product_name').notNull().default(''),
  kind: text('kind').notNull(),
  skinType: text('skin_type').notNull().default(''),
  duration: text('duration').notNull().default(''),
  body: text('body').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  reviewedAt: text('reviewed_at'),
}, (t) => [
  index('skin_forum_status_created_idx').on(t.status, t.createdAt),
  index('skin_forum_product_status_idx').on(t.productId, t.status),
  index('skin_forum_author_created_idx').on(t.authorHash, t.createdAt),
]);
