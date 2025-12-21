# MCP Server Tools Plan

## Current Tools (7) ✅

### Financial
1. ✅ `get_user_balance` - Get balance and credit limit

### Cards
2. ✅ `create_virtual_card` - Create virtual card
3. ✅ `get_user_cards` - List user's cards
4. ✅ `get_card_details` - Get card info
5. ✅ `get_card_payment_details` - Get PAN/CVC
6. ✅ `update_card_status` - Lock/unlock/cancel card
7. ✅ `update_card_limit` - Update spending limit

## Missing Tools to Add (10)

### User Management
8. ⬜ `initiate_user_application` - Create new user application
9. ⬜ `get_user_by_id` - Get user details from Convex
10. ⬜ `get_user_by_email` - Find user by email
11. ⬜ `list_users` - List all users
12. ⬜ `get_users_by_status` - Filter users by application status

### Cards (Additional)
13. ⬜ `get_card_from_rain` - Get fresh card data from Rain API
14. ⬜ `list_all_cards` - List all cards in database
15. ⬜ `cancel_card` - Convenience wrapper for canceling

### Contracts (Collateral)
16. ⬜ `get_user_contracts` - Get user's collateral contracts
17. ⬜ `create_user_contract` - Create collateral contract

## Tool Categories

### 🔵 Core Workflow Tools (Essential)
- `initiate_user_application` - Start user onboarding
- `get_user_balance` - Check credit before purchase
- `create_virtual_card` - Create card for purchase
- `get_card_payment_details` - Get card details for payment
- `update_card_status` - Lock card after purchase

### 🟢 User Management Tools
- `get_user_by_id` - Lookup user
- `get_user_by_email` - Find user by email
- `list_users` - Browse users
- `get_users_by_status` - Filter by status

### 🟡 Card Management Tools
- `get_user_cards` - List user cards
- `get_card_details` - Card info
- `get_card_from_rain` - Fresh data from API
- `list_all_cards` - Browse all cards
- `update_card_status` - Change status
- `update_card_limit` - Adjust limits
- `cancel_card` - Cancel card

### 🟠 Financial Tools
- `get_user_balance` - Credit/balance info
- `get_user_contracts` - Collateral contracts
- `create_user_contract` - Setup collateral

## Priority Order

### Phase 1: Essential Workflow (High Priority)
1. `initiate_user_application` - Complete user onboarding flow
2. `get_user_by_email` - Find users easily
3. `get_user_contracts` - Check collateral setup

### Phase 2: User Management (Medium Priority)
4. `get_user_by_id` - User lookup
5. `list_users` - User browsing
6. `get_users_by_status` - Filter users

### Phase 3: Advanced Features (Lower Priority)
7. `get_card_from_rain` - Fresh API data
8. `list_all_cards` - Card browsing
9. `create_user_contract` - Contract creation
10. `cancel_card` - Convenience wrapper

