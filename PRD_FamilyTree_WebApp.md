# Product Requirements Document (PRD)
## Family Tree Web Application

---

**Document Version:** 1.1  
**Date:** March 24, 2026  
**Status:** Draft  
**Author:** Product Team  
**Changelog:** v1.1 — Auth split into Phase 1 (form-only) and Phase 4 (OAuth); `updated_at` added to all schemas  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [User Personas](#3-user-personas)
4. [Features & Functional Requirements](#4-features--functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Data Model (Supabase)](#6-data-model-supabase)
7. [User Stories](#7-user-stories)
8. [Access Control & Permissions](#8-access-control--permissions)
9. [UI/UX Requirements](#9-uiux-requirements)
10. [Tech Stack Recommendations](#10-tech-stack-recommendations)
11. [Out of Scope](#11-out-of-scope)
12. [Risks & Mitigations](#12-risks--mitigations)
13. [Milestones & Timeline](#13-milestones--timeline)

---

## 1. Overview

### 1.1 Product Summary

Family Tree Web App is a self-service platform that empowers users to digitally document and manage their family genealogy. Each registered user can create and own a family tree, invite family members to collaborate, and manage individual member profiles — all in a structured, privacy-aware environment backed by Supabase.

### 1.2 Problem Statement

Families often struggle to maintain and share genealogical records across generations. Existing tools are either too complex (desktop software), too limited (simple tree builders), or do not support collaborative self-service editing. There is a clear need for a web-based platform that is:
- Accessible by all family members, not just one administrator
- Simple enough for non-technical users
- Flexible enough to store rich personal information
- Backed by a reliable, scalable database

### 1.3 Vision

> *"Every family member can own, contribute to, and explore their family history — from anywhere, at any time."*

---

## 2. Goals & Success Metrics

### 2.1 Business Goals

| Goal | Description |
|------|-------------|
| Enable self-service family management | Any invited family member can add/edit their own profile and relative profiles without needing admin intervention |
| Increase data completeness | Drive users to fill rich profiles beyond just names and dates |
| Drive engagement | Keep users returning to explore and update the tree |

### 2.2 Key Success Metrics (KPIs)

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Registered users | 1,000 |
| Average members per family tree | 15+ |
| Profile completion rate (≥5 fields filled) | ≥ 60% |
| Monthly Active Users (MAU) | ≥ 40% of registered users |
| Average edits per user per month | ≥ 3 |

---

## 3. User Personas

### Persona 1 — The Family Admin (Tree Owner)
- **Profile:** Ahmad, 45, a family patriarch who wants to document the family genealogy for the next generation
- **Goals:** Create the family tree, invite all relatives, ensure data accuracy
- **Pain Points:** Manually managing data for all members is tedious; wants others to help

### Persona 2 — The Contributing Member
- **Profile:** Sari, 28, Ahmad's daughter who wants to update her own profile and add her children
- **Goals:** Edit her own profile, add her nuclear family members
- **Pain Points:** Doesn't want to request admin to make every small change

### Persona 3 — The Curious Explorer
- **Profile:** Budi, 17, a teenager who wants to explore his ancestry and learn about relatives
- **Goals:** Browse the tree, read profiles, see photos and stories
- **Pain Points:** Complex interfaces are a barrier; wants something visual and easy

---

## 4. Features & Functional Requirements

### 4.1 Authentication & Onboarding

Authentication is delivered in two phases to keep Phase 1 lean and shippable quickly.

#### Phase 1 — Form-Based Auth (Email & Password only)

| ID | Requirement |
|----|-------------|
| AUTH-01 | Users can register via a Sign Up form with: Full Name, Email, Password, and Confirm Password fields |
| AUTH-02 | Users can log in via a Sign In form with: Email and Password fields |
| AUTH-03 | Password must meet minimum requirements: 8+ characters, at least one number |
| AUTH-04 | Inline form validation with clear error messages (e.g., "Email already in use", "Passwords do not match") |
| AUTH-05 | Password reset via email (user receives a reset link) |
| AUTH-06 | Email verification required before accessing the app — a verification link is sent on sign-up |
| AUTH-07 | Supabase Auth handles session management and JWT tokens |
| AUTH-08 | "Remember me" checkbox on Sign In to persist session |

> **Note:** No social login or third-party OAuth in Phase 1. The Sign In and Sign Up pages contain only standard HTML form inputs — no external provider buttons.

#### Phase 4 — Advanced Auth (OAuth & Enhanced Security)

| ID | Requirement |
|----|-------------|
| AUTH-P4-01 | Users can sign up and log in via Google OAuth |
| AUTH-P4-02 | Users can sign up and log in via Facebook OAuth |
| AUTH-P4-03 | Existing email/password accounts can be linked to an OAuth provider |
| AUTH-P4-04 | Multi-factor authentication (MFA/TOTP) as an optional security layer |
| AUTH-P4-05 | "Sign in with Magic Link" (passwordless email login) |
| AUTH-P4-06 | Session management dashboard — users can view and revoke active sessions |

---

### 4.2 Family Tree Management

| ID | Requirement |
|----|-------------|
| TREE-01 | A registered user can create one or more family trees |
| TREE-02 | Each tree has a name, description, cover photo, and privacy setting (Public / Family Only / Private) |
| TREE-03 | The tree creator becomes the **Owner** of that tree |
| TREE-04 | The Owner can invite other users to join the tree via email link |
| TREE-05 | The Owner can delete or archive a tree |
| TREE-06 | Trees are displayed as an interactive visual graph/chart |

---

### 4.3 Family Member Management (CRUD)

This is the core feature. Every family member who is part of the tree can perform CRUD operations on member profiles based on their permissions (see Section 8).

#### 4.3.1 Create Member

| ID | Requirement |
|----|-------------|
| MEM-01 | Any tree member can add a new person to the tree |
| MEM-02 | When creating a member, the creator must define the **relationship** to an existing member (e.g., child of, spouse of, sibling of) |
| MEM-03 | A member can be added as a **registered user** (linked account) or an **unregistered record** (name only, no login) |

#### 4.3.2 Member Profile Fields

Each member profile supports the following fields:

| Field | Type | Required |
|-------|------|----------|
| Full Name | Text | ✅ Yes |
| Nickname | Text | No |
| Gender | Enum (Male / Female / Other) | No |
| Date of Birth | Date | No |
| Place of Birth | Text | No |
| Date of Death | Date | No (if deceased) |
| Profile Photo | Image (stored in Supabase Storage) | No |
| Address / Current Location | Text / Map | No |
| Phone Number | Text | No |
| Email | Text | No |
| Occupation / Profession | Text | No |
| Education | Text | No |
| Biography / Life Story | Long Text | No |
| Religion | Text | No |
| Nationality | Text | No |
| Social Media Links | JSON (Instagram, Facebook, etc.) | No |
| Interests / Hobbies | Text Array | No |
| Custom Notes | Long Text | No |
| Gallery Photos | Images Array (Supabase Storage) | No |

#### 4.3.3 Read Member

| ID | Requirement |
|----|-------------|
| MEM-10 | Any tree member can view all member profiles in the tree |
| MEM-11 | Profile page shows full details, gallery, and their position in the tree |
| MEM-12 | Deceased members are visually differentiated (e.g., greyed out, icon) |

#### 4.3.4 Update Member

| ID | Requirement |
|----|-------------|
| MEM-20 | A member can edit their **own** profile at any time |
| MEM-21 | A member can edit profiles of their **direct relations** (spouse, children, parents) they added |
| MEM-22 | The Tree Owner and Admins can edit any profile |
| MEM-23 | All edits are timestamped (updated_at) and the editor is tracked (updated_by) |

#### 4.3.5 Delete Member

| ID | Requirement |
|----|-------------|
| MEM-30 | Only the Tree Owner or Admin can fully delete a member record |
| MEM-31 | Regular members can request deletion, which triggers an approval workflow to the Admin |
| MEM-32 | Deleting a member prompts the user to re-assign their relationships before deletion completes |

---

### 4.4 Relationship Management

| ID | Requirement |
|----|-------------|
| REL-01 | Supported relationships: Parent, Child, Spouse/Partner, Sibling |
| REL-02 | Multiple marriages/partnerships are supported (with date ranges) |
| REL-03 | Relationships are bidirectional — adding "A is parent of B" auto-creates "B is child of A" |
| REL-04 | Users can add relationship notes (e.g., "Adopted", "Step-sibling") |

---

### 4.5 Invitations & Collaboration

| ID | Requirement |
|----|-------------|
| INV-01 | Tree Owners and Admins can invite family members via email |
| INV-02 | An invitation email contains a unique link to join the tree |
| INV-03 | If the invitee is not registered, they are prompted to sign up first |
| INV-04 | When an invited user joins, they are automatically linked to an existing member record (if pre-created) |
| INV-05 | Members can be removed from the tree by the Owner |

---

### 4.6 Tree Visualization

| ID | Requirement |
|----|-------------|
| VIZ-01 | The tree is rendered as an interactive visual diagram (pedigree chart or descendant chart) |
| VIZ-02 | Users can zoom in/out and pan across the tree |
| VIZ-03 | Clicking a member node opens a side panel with their profile summary |
| VIZ-04 | The current logged-in user is highlighted in the tree |
| VIZ-05 | Option to toggle between compact view and expanded view |
| VIZ-06 | Tree can be exported as PNG or PDF |

---

### 4.7 Search & Discovery

| ID | Requirement |
|----|-------------|
| SRCH-01 | Users can search for members within a tree by name, nickname, or birthplace |
| SRCH-02 | Filter members by generation, gender, or alive/deceased status |
| SRCH-03 | "Find my relation" feature — shows the relationship path between any two members |

---

### 4.8 Notifications

| ID | Requirement |
|----|-------------|
| NOTIF-01 | Users are notified (in-app + email) when their profile is edited by someone else |
| NOTIF-02 | Users are notified when they are added to a new tree |
| NOTIF-03 | Birthday reminders for members (optional, user-configurable) |
| NOTIF-04 | Notification when a deletion request is submitted (to admin) |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Page load time ≤ 2 seconds; Tree visualization renders ≤ 3 seconds for trees up to 500 members |
| **Scalability** | Support up to 10,000 users and trees with 1,000+ members each |
| **Security** | Row Level Security (RLS) enforced at Supabase layer; no cross-family data leakage |
| **Availability** | 99.5% uptime SLA |
| **Accessibility** | WCAG 2.1 AA compliance |
| **Responsiveness** | Fully functional on desktop, tablet, and mobile browsers |
| **Data Privacy** | GDPR-ready; users can export or delete all their personal data |
| **Localization** | Support English and Bahasa Indonesia at launch |

---

## 6. Data Model (Supabase)

### 6.1 Core Tables

#### `users` (managed by Supabase Auth)
```
id            uuid (PK, from auth.users)
email         text
full_name     text
avatar_url    text
created_at    timestamptz
updated_at    timestamptz
```

#### `family_trees`
```
id            uuid (PK)
name          text NOT NULL
description   text
cover_photo   text (Supabase Storage URL)
privacy       enum('public', 'family_only', 'private') DEFAULT 'family_only'
owner_id      uuid FK → users.id
created_at    timestamptz
updated_at    timestamptz
```

#### `tree_members` *(junction: users with access to a tree)*
```
id            uuid (PK)
tree_id       uuid FK → family_trees.id
user_id       uuid FK → users.id
role          enum('owner', 'admin', 'member', 'viewer')
joined_at     timestamptz
invited_by    uuid FK → users.id
created_at    timestamptz
updated_at    timestamptz
```

#### `persons` *(individual records in a tree)*
```
id                uuid (PK)
tree_id           uuid FK → family_trees.id
linked_user_id    uuid FK → users.id (nullable — if the person has an account)
full_name         text NOT NULL
nickname          text
gender            enum('male', 'female', 'other', 'unknown')
birth_date        date
birth_place       text
death_date        date (nullable)
is_deceased       boolean DEFAULT false
profile_photo     text (Supabase Storage URL)
address           text
phone             text
email             text
occupation        text
education         text
biography         text
religion          text
nationality       text
social_links      jsonb
interests         text[]
custom_notes      text
created_by        uuid FK → users.id
updated_by        uuid FK → users.id
created_at        timestamptz
updated_at        timestamptz
```

#### `relationships`
```
id              uuid (PK)
tree_id         uuid FK → family_trees.id
person_a_id     uuid FK → persons.id
person_b_id     uuid FK → persons.id
relation_type   enum('parent', 'child', 'spouse', 'sibling')
relation_note   text (e.g., "Step-sibling", "Adopted")
start_date      date (nullable, for marriages)
end_date        date (nullable, for divorces/death)
created_by      uuid FK → users.id
created_at      timestamptz
updated_at      timestamptz
```

#### `person_gallery`
```
id            uuid (PK)
person_id     uuid FK → persons.id
photo_url     text (Supabase Storage URL)
caption       text
uploaded_by   uuid FK → users.id
created_at    timestamptz
updated_at    timestamptz
```

#### `deletion_requests`
```
id              uuid (PK)
tree_id         uuid FK → family_trees.id
person_id       uuid FK → persons.id
requested_by    uuid FK → users.id
reason          text
status          enum('pending', 'approved', 'rejected')
reviewed_by     uuid FK → users.id (nullable)
created_at      timestamptz
updated_at      timestamptz
```

#### `notifications`
```
id            uuid (PK)
user_id       uuid FK → users.id
type          text (e.g., 'profile_updated', 'tree_invite', 'birthday_reminder')
payload       jsonb
is_read       boolean DEFAULT false
created_at    timestamptz
updated_at    timestamptz
```

---

### 6.2 Supabase Row Level Security (RLS) Summary

| Table | Policy |
|-------|--------|
| `family_trees` | Owner can do all; members can read if privacy allows |
| `tree_members` | Owner/Admin can manage; users can read their own row |
| `persons` | Tree members can read; editing restricted by role and relationship (see Section 8) |
| `relationships` | Tree members can read; members can create/edit within their scope |
| `person_gallery` | Tree members can read; uploader can delete |
| `deletion_requests` | Requester can create; Owner/Admin can approve |
| `notifications` | Each user reads/writes only their own notifications |

---

## 7. User Stories

### Authentication
- As a new user, I want to fill out a simple Sign Up form (name, email, password) so I can create an account quickly without needing a social media login.
- As a returning user, I want to sign in with my email and password using a clean Sign In form.
- As a user who forgot my password, I want to receive a reset link by email so I can regain access.
- *(Phase 4)* As a user, I want to log in with my Google account for faster access.

### Tree Management
- As a family admin, I want to create a family tree with a name and description so I can organize my genealogy.
- As a family admin, I want to invite my relatives via email so they can contribute to the tree.
- As a family admin, I want to set the privacy of my tree so I can control who sees our family data.

### Member Management
- As a family member, I want to update my own profile with my address and occupation so the family has up-to-date information.
- As a family member, I want to add my children to the tree with their birth details.
- As a family member, I want to upload photos to my profile gallery so relatives can see my memories.
- As a family admin, I want to delete an incorrect member record after receiving a request.

### Exploration
- As a curious family member, I want to browse the visual family tree to understand how everyone is related.
- As a user, I want to search for a relative by name to quickly find their profile.
- As a user, I want to see the relationship path between me and a distant cousin.

---

## 8. Access Control & Permissions

| Action | Owner | Admin | Member | Viewer |
|--------|:-----:|:-----:|:------:|:------:|
| Create tree | ✅ | — | — | — |
| Delete tree | ✅ | ❌ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| View all profiles | ✅ | ✅ | ✅ | ✅ |
| Add new person | ✅ | ✅ | ✅ | ❌ |
| Edit own profile | ✅ | ✅ | ✅ | ❌ |
| Edit direct relations | ✅ | ✅ | ✅ | ❌ |
| Edit any profile | ✅ | ✅ | ❌ | ❌ |
| Delete any profile | ✅ | ✅ | ❌ | ❌ |
| Request deletion | ✅ | ✅ | ✅ | ❌ |
| Export tree (PNG/PDF) | ✅ | ✅ | ✅ | ✅ |
| Change tree settings | ✅ | ✅ | ❌ | ❌ |

> **Note:** A "Member" can edit profiles of persons they directly added or persons who are their direct relations (spouse, parent, child) in the tree.

---

## 9. UI/UX Requirements

### 9.1 Key Screens

| Screen | Description |
|--------|-------------|
| **Landing / Home** | App introduction with CTA to sign up or log in |
| **Dashboard** | Lists all trees the user belongs to |
| **Tree View** | Interactive visual diagram of the family tree |
| **Member Profile** | Full profile page for a single person |
| **Add/Edit Member Form** | Multi-step form to create or update a member profile |
| **Invite Members** | Page to send email invitations |
| **Notifications** | List of recent activity and alerts |
| **Settings** | User account settings and tree settings |

### 9.2 Design Principles
- **Mobile-first**: Core actions (view tree, edit profile) must work on mobile
- **Visual clarity**: The tree visualization should be uncluttered with a clean layout
- **Progressive disclosure**: Show basic info first; advanced fields in expandable sections
- **Friendly tone**: Use warm language — this is a family app, not a corporate tool

---

## 10. Tech Stack Recommendations

| Layer | Recommendation | Rationale |
|-------|---------------|-----------|
| **Frontend** | Next.js (React) or Vite (React SPA) | SSG/SPA both deploy cleanly on Netlify; excellent Supabase integration |
| **Styling** | Tailwind CSS | Rapid UI development |
| **Tree Visualization** | `react-d3-tree` or `family-chart` | Purpose-built for genealogy trees |
| **Backend / DB** | Supabase (PostgreSQL) | Real-time, RLS, Auth, Storage in one platform |
| **Auth** | Supabase Auth | Email, OAuth providers, JWT |
| **File Storage** | Supabase Storage | Profile photos, gallery images |
| **Hosting** | Netlify | Deploys to netlify.app; supports Next.js via `@netlify/plugin-nextjs` or zero-config static SPA export |
| **Email (Invites/Notif)** | Resend or Supabase Edge Functions | Transactional email |

---

## 11. Out of Scope

The following features are explicitly **not** in scope for the initial release (v1.0):

- DNA / genetic genealogy integration
- Document scanning / OCR (birth certificates, etc.)
- Advanced family tree merging across different owners
- Mobile native apps (iOS / Android)
- Paid/subscription tiers
- AI-powered story generation from member data
- Public family tree directory / search across all trees

These may be considered for future roadmap phases.

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| RLS misconfiguration causing data leaks | Medium | High | Regular security audits; automated RLS tests |
| Users entering incorrect family relationships | High | Medium | Confirmation dialogs on bidirectional relationship creation |
| Tree visualization slow for large families | Medium | Medium | Lazy loading nodes; virtualized rendering for 200+ nodes |
| Spam or abuse of invitations | Low | Medium | Rate-limit invitation sends; CAPTCHA on sign-up |
| GDPR / data privacy violations | Low | High | Data export & delete endpoints from day one; privacy policy |
| Low adoption due to complexity | Medium | High | Onboarding tutorial; guided tree setup wizard for new users |

---

## 13. Milestones & Timeline

| Phase | Milestone | Estimated Duration |
|-------|-----------|-------------------|
| **Phase 1** | Form-based Auth (Sign Up / Sign In / Password Reset), Tree creation, Basic member CRUD | 4 weeks |
| **Phase 2** | Tree visualization, Relationships, Invitations | 4 weeks |
| **Phase 3** | Rich profiles (gallery, social links), Notifications | 3 weeks |
| **Phase 4** | Advanced Auth (Google & Facebook OAuth, MFA, Magic Link), Search, Filters, Export (PNG/PDF) | 3 weeks |
| **Phase 5** | QA, Performance tuning, Security audit | 2 weeks |
| **Launch** | Public Beta Release | — |

> **Total estimated development time:** ~16 weeks (for a 2–3 person team)

---

## Appendix A — Glossary

| Term | Definition |
|------|------------|
| **Tree** | A family tree created by a user |
| **Person / Member** | An individual record within a tree |
| **Owner** | The user who created the tree |
| **Admin** | A trusted member with elevated editing rights |
| **Linked User** | A person record associated with a registered user account |
| **RLS** | Row Level Security — Supabase's mechanism for database-level access control |

---

*End of Document — PRD v1.1 — Family Tree Web App*
