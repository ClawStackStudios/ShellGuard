import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ShellGuard Docs',
  description: 'The Sovereign Zero-Knowledge Secrets Vault for Humans & AI Agents',
  base: process.env.VITEPRESS_BASE || '/ShellGuard/',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: [
    /^https?:\/\/localhost/,
    /^http:\/\/127\.0\.0\.1/
  ],

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/assets/shellguard-icon.svg' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'ShellGuard Docs — Sovereign Secrets Vault' }],
    ['meta', { property: 'og:description', content: 'Zero-knowledge password & secrets vault with autonomous AI agent key management and triple-layer defense.' }],
    ['meta', { property: 'og:image', content: '/assets/shellguard-thumbnail.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'theme-color', content: '#e4048a' }],
  ],

  themeConfig: {
    logo: '/assets/shellguard-icon.svg',
    siteTitle: 'ShellGuard',

    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            fuzzy: 0.2,
            prefix: true,
            boost: { title: 4, heading: 2 }
          }
        }
      }
    },

    nav: [
      { text: 'Get Started', link: '/getting-started/' },
      { text: 'Architecture & Security', link: '/architecture/' },
      { text: 'Vault Features', link: '/vault-features/' },
      { text: 'Agent API', link: '/agent-integration/' },
      { text: 'SuperLobster', link: '/superlobster/' },
      { text: 'Deployment', link: '/deployment/' },
      { text: 'Reference', link: '/reference/' },
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview & Philosophy', link: '/getting-started/' },
            { text: '5-Minute Quickstart', link: '/getting-started/quickstart' },
            { text: 'Key Molting & hu- Identity', link: '/getting-started/key-molting' },
          ]
        },
        {
          text: 'Next Steps',
          items: [
            { text: 'Architecture Blueprint', link: '/architecture/' },
            { text: 'The Grotto Vault', link: '/vault-features/the-grotto' },
            { text: 'Deploy with Docker', link: '/deployment/docker' },
          ]
        }
      ],

      '/architecture/': [
        {
          text: 'System Architecture',
          items: [
            { text: 'Pipeline Overview', link: '/architecture/' },
            { text: 'Triple-Layer Encryption', link: '/architecture/triple-layer-crypto' },
            { text: 'The Three Secrets Model', link: '/architecture/three-secrets' },
            { text: 'Threat Model & Hardening', link: '/architecture/threat-model' },
          ]
        },
        {
          text: 'Under The Hood',
          items: [
            { text: 'Database Blueprint (Schema)', link: '/reference/blueprint-schema' },
            { text: 'Forensic Audit Reef', link: '/deployment/forensic-auditing' },
          ]
        }
      ],

      '/vault-features/': [
        {
          text: 'Vault Features',
          items: [
            { text: 'The Grotto & Pods', link: '/vault-features/the-grotto' },
            { text: 'Password Attachments', link: '/vault-features/attachments' },
            { text: 'Pearl Password Generator', link: '/vault-features/pearl-generator' },
            { text: 'Import & Export', link: '/vault-features/import-export' },
          ]
        }
      ],

      '/agent-integration/': [
        {
          text: 'AI Agent Integration',
          items: [
            { text: 'Autonomous Agents Overview', link: '/agent-integration/' },
            { text: 'LobsterKeys (lb-) Lifecycle', link: '/agent-integration/lobster-keys' },
            { text: 'REST API Matrix', link: '/agent-integration/api-reference' },
            { text: 'Agent Skill Blueprint (/skill.md)', link: '/agent-integration/skill-guide' },
          ]
        }
      ],

      '/superlobster/': [
        {
          text: 'SuperLobster Control Plane',
          items: [
            { text: 'Admin Plane Overview', link: '/superlobster/' },
            { text: 'Lobster Ledger & Cascades', link: '/superlobster/management' },
            { text: 'Failsafe Backups', link: '/superlobster/backups' },
            { text: 'Offline Database Restoration', link: '/superlobster/restoration' },
          ]
        }
      ],

      '/deployment/': [
        {
          text: 'Deployment & Operations',
          items: [
            { text: 'Docker & Compose Stacks', link: '/deployment/docker' },
            { text: 'Unraid Community Apps', link: '/deployment/unraid' },
            { text: 'Reverse Proxy & TLS', link: '/deployment/reverse-proxy' },
            { text: 'Forensic Auditing (audit.sqlite)', link: '/deployment/forensic-auditing' },
          ]
        }
      ],

      '/reference/': [
        {
          text: 'Technical Reference',
          items: [
            { text: 'Database Schema Ground Truth', link: '/reference/blueprint-schema' },
            { text: 'Reef Modernist Design System', link: '/reference/design-system' },
            { text: 'ClawStack Lexicon (Glossary)', link: '/reference/glossary' },
            { text: 'Privacy Policy', link: '/privacy' },
          ]
        }
      ],

      '/privacy': [
        {
          text: 'Legal & Compliance',
          items: [
            { text: 'Privacy Policy', link: '/privacy' },
            { text: 'ClawStack Lexicon (Glossary)', link: '/reference/glossary' },
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/clawstackstudios/shellguard' }
    ],

    footer: {
      message: 'Sovereign Zero-Knowledge Secrets Vault. Released under AGPL-3.0. • <a href="/ShellGuard/privacy">Privacy Policy</a>',
      copyright: 'Copyright © 2026 ClawStack Studios & CrustAgent©™'
    }
  }
})
