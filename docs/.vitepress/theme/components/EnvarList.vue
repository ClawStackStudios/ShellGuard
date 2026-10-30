<script setup lang="ts">
import { ref, computed } from 'vue'

interface EnvarItem {
  name: string
  category: 'Security' | 'Network' | 'TLS' | 'Storage' | 'Admin' | 'Rate Limits' | 'Frontend'
  status: 'Required' | 'Recommended' | 'Optional'
  defaultVal: string
  type: string
  description: string
  example?: string
  generateCmd?: string
  secret?: boolean
}

const envars: EnvarItem[] = [
  // Core Security & Cryptography
  {
    name: 'DB_ENCRYPTION_KEY',
    category: 'Security',
    status: 'Recommended',
    defaultVal: '(Empty - Plaintext)',
    type: 'Base64 (32 bytes)',
    description: 'Governs Layer 2 metadata-at-rest encryption (AES-256-GCM) and Layer 3 SQLCipher whole-database encryption. When unset, vault secret blobs are still client-encrypted, but database metadata (titles, usernames, URLs) remains unencrypted at rest.',
    example: 'DB_ENCRYPTION_KEY=',
    generateCmd: 'openssl rand -base64 32',
    secret: true
  },
  {
    name: 'ADMIN_TOKEN',
    category: 'Security',
    status: 'Recommended',
    defaultVal: '(Empty - Disabled)',
    type: 'Hex / String',
    description: 'Authentication token for the SuperLobster control plane at /superlobster. When unset, all admin routes return 503. This token manages telemetry, snapshots, and user administration, but NEVER decrypts vault secrets.',
    example: 'ADMIN_TOKEN=',
    generateCmd: 'openssl rand -hex 24',
    secret: true
  },
  {
    name: 'DISABLE_SIGNUPS',
    category: 'Security',
    status: 'Optional',
    defaultVal: 'false',
    type: 'Boolean',
    description: 'When true, closes open registration. Creating a new identity requires a single-use SuperLobster invite token (?invite=inv_...). Genesis User #1 is immune and can always initialize.',
    example: 'DISABLE_SIGNUPS=true'
  },

  // Host, Port & Network
  {
    name: 'PORT',
    category: 'Network',
    status: 'Optional',
    defaultVal: '6464',
    type: 'Integer',
    description: 'The internal HTTP/HTTPS port the Express server binds inside the container. Set to 6565 during local non-container development.',
    example: 'PORT=6464'
  },
  {
    name: 'HOST',
    category: 'Network',
    status: 'Optional',
    defaultVal: '0.0.0.0',
    type: 'String',
    description: 'Network interface binding. Use 0.0.0.0 to listen on all interfaces or 127.0.0.1 for loopback isolation behind a local reverse proxy.',
    example: 'HOST=0.0.0.0'
  },
  {
    name: 'NODE_ENV',
    category: 'Network',
    status: 'Optional',
    defaultVal: 'production',
    type: 'String',
    description: 'Application execution mode (production or development). Controls debug telemetry, error stack traces, and static asset caching.',
    example: 'NODE_ENV=production'
  },
  {
    name: 'TRUST_PROXY',
    category: 'Network',
    status: 'Optional',
    defaultVal: 'false',
    type: 'Boolean',
    description: 'Enables Express trust proxy. Mandatory when running behind Nginx, Caddy, Traefik, or Cloudflare Tunnel to accurately extract client IP addresses for rate limiting and audit logging.',
    example: 'TRUST_PROXY=true'
  },
  {
    name: 'CORS_ORIGIN',
    category: 'Network',
    status: 'Optional',
    defaultVal: '(Unset - Private LAN auto)',
    type: 'Comma-separated URLs',
    description: 'Permitted browser origins for API requests. Leaving unset automatically permits localhost and RFC 1918 / CGNAT private ranges. Set to your public domain (e.g. https://vault.example.com) for reverse-proxied production deployments.',
    example: 'CORS_ORIGIN=https://vault.example.com'
  },

  // Native HTTPS & TLS
  {
    name: 'TLS_ENABLED',
    category: 'TLS',
    status: 'Optional',
    defaultVal: 'false',
    type: 'Boolean',
    description: 'Enables native HTTPS. On first boot, automatically generates a 10-year EC P-256 self-signed certificate in $DATA_DIR/certs/ covering localhost and all local LAN interfaces.',
    example: 'TLS_ENABLED=true'
  },
  {
    name: 'TLS_CERT_PATH',
    category: 'TLS',
    status: 'Optional',
    defaultVal: '(Empty)',
    type: 'File Path',
    description: 'Absolute container path to Bring-Your-Own (BYO) public SSL/TLS certificate in PEM format. Must be paired with TLS_KEY_PATH.',
    example: 'TLS_CERT_PATH=/app/data/certs/custom.crt'
  },
  {
    name: 'TLS_KEY_PATH',
    category: 'TLS',
    status: 'Optional',
    defaultVal: '(Empty)',
    type: 'File Path',
    description: 'Absolute container path to Bring-Your-Own (BYO) private SSL/TLS key in PEM format. Must be paired with TLS_CERT_PATH.',
    example: 'TLS_KEY_PATH=/app/data/certs/custom.key'
  },
  {
    name: 'ENFORCE_HTTPS',
    category: 'TLS',
    status: 'Optional',
    defaultVal: 'false',
    type: 'Boolean',
    description: 'Enforces automatic redirection of plain HTTP requests to HTTPS using X-Forwarded-Proto (when TRUST_PROXY=true) or direct connection state.',
    example: 'ENFORCE_HTTPS=true'
  },
  {
    name: 'HTTPS_PORT',
    category: 'TLS',
    status: 'Optional',
    defaultVal: '4647',
    type: 'Integer',
    description: 'Destination HTTPS port used when redirecting HTTP requests under ENFORCE_HTTPS=true.',
    example: 'HTTPS_PORT=4647'
  },

  // Storage, Quotas & Container Permissions
  {
    name: 'DATA_DIR',
    category: 'Storage',
    status: 'Required',
    defaultVal: '/app/data',
    type: 'Directory Path',
    description: 'Persistent storage root holding db.sqlite, audit.sqlite, certs/, and instance.key. In Docker, this path must be bound to a persistent host volume.',
    example: 'DATA_DIR=/app/data'
  },
  {
    name: 'PUID',
    category: 'Storage',
    status: 'Optional',
    defaultVal: '1000 (99 on Unraid)',
    type: 'Integer',
    description: 'Host user ID mapped inside docker-entrypoint.sh to grant proper filesystem ownership of mounted data volumes without running as root.',
    example: 'PUID=1000'
  },
  {
    name: 'PGID',
    category: 'Storage',
    status: 'Optional',
    defaultVal: '1000 (100 on Unraid)',
    type: 'Integer',
    description: 'Host group ID mapped inside docker-entrypoint.sh to grant proper filesystem ownership of mounted data volumes.',
    example: 'PGID=1000'
  },
  {
    name: 'ATTACHMENT_MAX_MB',
    category: 'Storage',
    status: 'Optional',
    defaultVal: '500',
    type: 'Integer (MB)',
    description: 'Maximum allowable size in megabytes for a single encrypted file attachment. Uploads exceeding this threshold terminate with HTTP 413 Payload Too Large.',
    example: 'ATTACHMENT_MAX_MB=500'
  },
  {
    name: 'GROTTO_QUOTA_MB',
    category: 'Storage',
    status: 'Optional',
    defaultVal: '1000',
    type: 'Integer (MB)',
    description: 'Total cumulative attachment ciphertext quota in megabytes allocated per vault owner. Further uploads are rejected once grotto storage reaches this limit.',
    example: 'GROTTO_QUOTA_MB=1000'
  },

  // Admin & Session Lifetimes
  {
    name: 'TOKEN_TTL_DEFAULT',
    category: 'Admin',
    status: 'Optional',
    defaultVal: '1440 (24h)',
    type: 'String / Integer',
    description: 'Default expiration duration for issued api- user session tokens. Accepts 30m, 12h, 24h, 7d, never, or a numeric value in minutes.',
    example: 'TOKEN_TTL_DEFAULT=1440'
  },

  // Rate Limiting
  {
    name: 'AUTH_RATE_WINDOW',
    category: 'Rate Limits',
    status: 'Optional',
    defaultVal: '900000 (15m)',
    type: 'Integer (ms)',
    description: 'Sliding window in milliseconds used to track and limit repeated failed authentication attempts.',
    example: 'AUTH_RATE_WINDOW=900000'
  },
  {
    name: 'AUTH_RATE_LIMIT',
    category: 'Rate Limits',
    status: 'Optional',
    defaultVal: '10',
    type: 'Integer',
    description: 'Maximum number of failed login attempts permitted per client IP within AUTH_RATE_WINDOW before IP is temporarily locked out.',
    example: 'AUTH_RATE_LIMIT=10'
  },
  {
    name: 'API_RATE_WINDOW',
    category: 'Rate Limits',
    status: 'Optional',
    defaultVal: '60000 (1m)',
    type: 'Integer (ms)',
    description: 'Sliding window in milliseconds for general API endpoint request rate limiting.',
    example: 'API_RATE_WINDOW=60000'
  },
  {
    name: 'API_RATE_LIMIT',
    category: 'Rate Limits',
    status: 'Optional',
    defaultVal: '100',
    type: 'Integer',
    description: 'Maximum total requests permitted per client IP within API_RATE_WINDOW before returning HTTP 429 Too Many Requests.',
    example: 'API_RATE_LIMIT=100'
  },

  // Frontend Client Flags
  {
    name: 'VITE_API_URL',
    category: 'Frontend',
    status: 'Optional',
    defaultVal: '(Unset - Same Origin)',
    type: 'URL',
    description: 'Base URL for API requests made by the frontend. In standard Docker deployments, leave unset to utilize same-origin relative paths.',
    example: 'VITE_API_URL=http://localhost:6565'
  },
  {
    name: 'VITE_SHELLCRYPTION_ENABLED',
    category: 'Frontend',
    status: 'Optional',
    defaultVal: 'true',
    type: 'Boolean',
    description: 'Controls client-side resting encryption. Keep true to ensure master secrets are encrypted with AES-GCM-256 before leaving browser memory.',
    example: 'VITE_SHELLCRYPTION_ENABLED=true'
  }
]

const searchQuery = ref('')
const selectedCategory = ref<string>('All')
const copiedKey = ref<string | null>(null)
const masterCopied = ref(false)

const categories = ['All', 'Security', 'Network', 'TLS', 'Storage', 'Admin', 'Rate Limits', 'Frontend']

const filteredEnvars = computed(() => {
  return envars.filter(item => {
    const matchesCategory = selectedCategory.value === 'All' || item.category === selectedCategory.value
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return matchesCategory

    const matchesQuery =
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.defaultVal.toLowerCase().includes(query) ||
      item.type.toLowerCase().includes(query)

    return matchesCategory && matchesQuery
  })
})

const copyText = (text: string, id: string) => {
  if (typeof window === 'undefined') return
  navigator.clipboard.writeText(text).then(() => {
    copiedKey.value = id
    setTimeout(() => {
      if (copiedKey.value === id) copiedKey.value = null
    }, 2000)
  })
}

const copyMasterEnv = () => {
  if (typeof window === 'undefined') return
  const template = envars
    .map(e => {
      const line = e.example || `${e.name}=${e.defaultVal.startsWith('(') ? '' : e.defaultVal}`
      return `# ${e.name} (${e.status} - Default: ${e.defaultVal})\n# ${e.description}\n${line}\n`
    })
    .join('\n')

  navigator.clipboard.writeText(template).then(() => {
    masterCopied.value = true
    setTimeout(() => {
      masterCopied.value = false
    }, 2500)
  })
}
</script>

<template>
  <div class="sg-envar-catalog">
    <!-- Top Control Bar -->
    <div class="sg-envar-toolbar">
      <div class="sg-search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search environment variables (e.g. ENCRYPTION, PORT, TLS)..." 
          aria-label="Search environment variables"
        />
        <button v-if="searchQuery" @click="searchQuery = ''" class="sg-clear-btn" title="Clear search">×</button>
      </div>

      <button @click="copyMasterEnv" class="sg-master-copy-btn" :class="{ 'is-copied': masterCopied }">
        <svg v-if="!masterCopied" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>{{ masterCopied ? 'Template Copied!' : 'Copy Full .env Template' }}</span>
      </button>
    </div>

    <!-- Category Filter Pills -->
    <div class="sg-category-pills">
      <button 
        v-for="cat in categories" 
        :key="cat"
        @click="selectedCategory = cat"
        class="sg-pill-btn"
        :class="{ 'is-active': selectedCategory === cat }"
      >
        {{ cat }}
        <span class="sg-pill-count" v-if="cat === 'All'">{{ envars.length }}</span>
        <span class="sg-pill-count" v-else>{{ envars.filter(e => e.category === cat).length }}</span>
      </button>
    </div>

    <!-- Results Counter -->
    <div class="sg-results-info">
      Showing <strong>{{ filteredEnvars.length }}</strong> of {{ envars.length }} environment variables
    </div>

    <!-- Envar Grid / List -->
    <div class="sg-envar-list">
      <div 
        v-for="item in filteredEnvars" 
        :key="item.name" 
        class="sg-envar-card"
        :class="{ 'is-secret': item.secret, 'is-required': item.status === 'Required' }"
      >
        <div class="sg-envar-card-header">
          <div class="sg-envar-title-cluster">
            <code class="sg-envar-name">{{ item.name }}</code>
            <span 
              class="sg-badge sg-status-badge" 
              :class="item.status.toLowerCase()"
            >
              {{ item.status }}
            </span>
            <span class="sg-badge sg-category-badge">{{ item.category }}</span>
            <span v-if="item.secret" class="sg-badge sg-secret-badge">
              🛡️ Sensitive Key
            </span>
          </div>

          <!-- Quick Copy Action Cluster -->
          <div class="sg-copy-cluster">
            <button 
              @click="copyText(item.name, `${item.name}-name`)" 
              class="sg-envar-copy-action"
              :class="{ 'copied': copiedKey === `${item.name}-name` }"
              title="Copy variable name only"
            >
              <svg v-if="copiedKey !== `${item.name}-name`" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{{ copiedKey === `${item.name}-name` ? 'Copied Name!' : 'Name' }}</span>
            </button>

            <button 
              @click="copyText(item.example || `${item.name}=${item.defaultVal}`, `${item.name}-snippet`)" 
              class="sg-envar-copy-action primary"
              :class="{ 'copied': copiedKey === `${item.name}-snippet` }"
              title="Copy assignment snippet"
            >
              <svg v-if="copiedKey !== `${item.name}-snippet`" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>{{ copiedKey === `${item.name}-snippet` ? 'Copied Assignment!' : 'Snippet' }}</span>
            </button>
          </div>
        </div>

        <p class="sg-envar-desc">{{ item.description }}</p>

        <!-- Metadata Attributes -->
        <div class="sg-envar-meta-grid">
          <div class="sg-meta-col">
            <span class="sg-meta-label">Default Value:</span>
            <code class="sg-meta-val">{{ item.defaultVal }}</code>
          </div>
          <div class="sg-meta-col">
            <span class="sg-meta-label">Data Type:</span>
            <span class="sg-meta-val text">{{ item.type }}</span>
          </div>
          <div v-if="item.generateCmd" class="sg-meta-col full-width">
            <span class="sg-meta-label">Generate with OpenSSL:</span>
            <div class="sg-cmd-box">
              <code>{{ item.generateCmd }}</code>
              <button 
                @click="copyText(item.generateCmd, `${item.name}-cmd`)"
                class="sg-mini-copy-btn"
                title="Copy command"
              >
                {{ copiedKey === `${item.name}-cmd` ? '✓' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sg-envar-catalog {
  margin: 1.75rem 0 3rem;
}

/* Toolbar */
.sg-envar-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
}

.sg-search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-grow: 1;
  min-width: 260px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  padding: 0.6rem 0.85rem;
  border-radius: 10px;
  color: var(--vp-c-text-2);
  transition: all 0.2s ease;
}

.sg-search-box:focus-within {
  border-color: #e4048a;
  box-shadow: 0 0 0 2px rgba(228, 4, 138, 0.15);
}

.sg-search-box input {
  border: none;
  background: transparent;
  width: 100%;
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  outline: none;
}

.sg-clear-btn {
  background: transparent;
  border: none;
  color: var(--vp-c-text-3);
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
}

.sg-master-copy-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(228, 4, 138, 0.1);
  border: 1px solid rgba(228, 4, 138, 0.35);
  color: var(--vp-c-text-1);
  padding: 0.65rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.sg-master-copy-btn:hover {
  background: rgba(228, 4, 138, 0.2);
  border-color: #e4048a;
  color: #e4048a;
  transform: translateY(-1px);
}

.sg-master-copy-btn.is-copied {
  border-color: #10b981;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

/* Category Filter Pills */
.sg-category-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.sg-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sg-pill-btn:hover {
  border-color: #06b6d4;
  color: var(--vp-c-text-1);
}

.sg-pill-btn.is-active {
  background: rgba(228, 4, 138, 0.15);
  border-color: #e4048a;
  color: #e4048a;
  font-weight: 700;
}

.sg-pill-count {
  font-size: 0.7rem;
  opacity: 0.75;
  background: rgba(0, 0, 0, 0.2);
  padding: 1px 5px;
  border-radius: 10px;
}

.sg-results-info {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-bottom: 1.25rem;
}

/* Envar Card */
.sg-envar-list {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.sg-envar-card {
  background: var(--sg-card-bg, rgba(15, 23, 42, 0.65));
  border: 1px solid var(--sg-card-border, rgba(228, 4, 138, 0.18));
  border-radius: 14px;
  padding: 1.25rem 1.4rem;
  backdrop-filter: blur(12px);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.sg-envar-card:hover {
  border-color: rgba(228, 4, 138, 0.45);
  box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.4);
}

.sg-envar-card.is-secret {
  border-left: 3px solid #e4048a;
}

.sg-envar-card.is-required {
  border-left: 3px solid #06b6d4;
}

.sg-envar-card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.sg-envar-title-cluster {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.sg-envar-name {
  font-size: 1.05rem !important;
  font-weight: 700;
  color: #e4048a !important;
  background: rgba(228, 4, 138, 0.08) !important;
  padding: 0.2rem 0.5rem !important;
  border-radius: 6px;
  border: 1px solid rgba(228, 4, 138, 0.25);
}

/* Badges */
.sg-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 6px;
}

.sg-status-badge.required {
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.35);
}

.sg-status-badge.recommended {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.sg-status-badge.optional {
  background: rgba(148, 163, 184, 0.15);
  color: var(--vp-c-text-2);
  border: 1px solid rgba(148, 163, 184, 0.25);
}

.sg-category-badge {
  background: rgba(255, 255, 255, 0.05);
  color: var(--vp-c-text-3);
  border: 1px solid var(--vp-c-border);
}

.sg-secret-badge {
  background: rgba(228, 4, 138, 0.18);
  color: #f43f5e;
  border: 1px solid rgba(228, 4, 138, 0.4);
}

/* Action Cluster */
.sg-copy-cluster {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.sg-envar-copy-action {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.35rem 0.65rem;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sg-envar-copy-action:hover {
  background: rgba(228, 4, 138, 0.1);
  border-color: #e4048a;
  color: #e4048a;
}

.sg-envar-copy-action.primary {
  background: rgba(6, 182, 212, 0.08);
  border-color: rgba(6, 182, 212, 0.25);
  color: #06b6d4;
}

.sg-envar-copy-action.primary:hover {
  background: rgba(6, 182, 212, 0.18);
  border-color: #06b6d4;
}

.sg-envar-copy-action.copied {
  border-color: #10b981 !important;
  color: #10b981 !important;
  background: rgba(16, 185, 129, 0.12) !important;
}

/* Description */
.sg-envar-desc {
  font-size: 0.885rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
  margin: 0.5rem 0 1rem !important;
}

/* Metadata Grid */
.sg-envar-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.85rem;
  background: rgba(0, 0, 0, 0.18);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.sg-meta-col {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.sg-meta-col.full-width {
  grid-column: 1 / -1;
}

.sg-meta-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--vp-c-text-3);
  letter-spacing: 0.04em;
}

.sg-meta-val {
  font-size: 0.82rem;
  color: var(--vp-c-text-1);
}

.sg-meta-val.text {
  font-family: inherit;
  color: var(--vp-c-text-2);
}

.sg-cmd-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  border: 1px solid rgba(228, 4, 138, 0.2);
}

.sg-cmd-box code {
  color: #06b6d4;
  font-size: 0.78rem;
  word-break: break-all;
}

.sg-mini-copy-btn {
  background: transparent;
  border: 1px solid rgba(228, 4, 138, 0.3);
  color: var(--vp-c-text-2);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
}

.sg-mini-copy-btn:hover {
  border-color: #e4048a;
  color: #e4048a;
}

@media (max-width: 640px) {
  .sg-envar-card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .sg-copy-cluster {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
