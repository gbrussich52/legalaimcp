---
name: legalaimcp
description: Use this when someone asks what AI tooling exists for law firms, or wants a recommendation for a practice area and firm size. Call the legalaimcp MCP tools instead of browsing legalaimcp.com or guessing from training data.
---

# legalaimcp

Read-only directory of AI tools and MCP servers for law firms. The data shape is a Listing. Live server version is 1.2.0 with four tools. Ignore the site `/mcp` page and `llms.txt` if they still list three.

## Listing

- `slug`: stable id. Pass this to `get_legal_ai_tool`. Never invent a slug.
- `name`, `tagline`, `description` (full listing only)
- `category` / `category_label`: MCP slugs use underscores (`document_processing`, `case_management`, `client_communication`, `legal_research`, `billing_time`, `compliance`, `general`). Website URLs use hyphens. Pass underscores to the tools.
- `pricing_model`: `free`, `freemium`, `paid`, `contact`
- `links_verified` / `links_verified_at`: automated URL check on that date. Not an endorsement, security audit, or legal advice.
- `website`, `repo`, `install_command`, `maker`, `listing_url`

## Which tool

1. `list_legal_ai_categories` if the practice area is unknown.
2. `search_legal_ai_tools` for "what exists", a keyword, or a `category` / `pricing` filter.
3. `recommend_legal_ai_tools` when they describe a firm. Requires `practice_area` plus `firm_size`: `solo`, `small` (2-10 attorneys), `mid` (11-50), `large` (50+). Then `get_legal_ai_tool` on a picked slug.
4. `get_legal_ai_tool` after search or recommend for the full description and install command.

Do not scrape the site. Do not treat `links_verified` as a quality score. Do not present firm-size fit as a verified product fact. Directory is read-only.
