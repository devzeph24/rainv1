# MCP Server Tools Reference

Your Rain Cards MCP server now has **16 tools** organized into 4 categories.

## 📊 Tool Summary

| Category | Count | Tools |
|----------|-------|-------|
| **User Management** | 4 | initiate_user_application, get_user_by_id, get_user_by_email, list_users |
| **Card Management** | 7 | create_virtual_card, get_user_cards, get_card_details, get_card_payment_details, update_card_status, update_card_limit, get_card_from_rain, list_all_cards |
| **Financial** | 2 | get_user_balance, get_user_contracts |
| **Contracts** | 1 | create_user_contract |

---

## 🔵 User Management Tools

### 1. `initiate_user_application`
**Purpose**: Create a new user application (first step in onboarding)

**Parameters**:
- `firstName` (string, required): User first name
- `lastName` (string, required): User last name  
- `email` (string, required): User email address
- `walletAddress` (string, optional): EVM wallet address

**Returns**: Application details with completion links

**Use Case**: Start onboarding a new user

---

### 2. `get_user_by_id`
**Purpose**: Get user details by Rain user ID from database

**Parameters**:
- `userId` (string, required): The Rain user ID

**Returns**: User information including status, address, wallet addresses

**Use Case**: Look up user information

---

### 3. `get_user_by_email`
**Purpose**: Find user(s) by email address

**Parameters**:
- `email` (string, required): User email address

**Returns**: Array of users with matching email

**Use Case**: Find user by email

---

### 4. `list_users`
**Purpose**: List all users in the database

**Parameters**:
- `limit` (number, optional): Max users to return (default: 50, max: 100)
- `status` (enum, optional): Filter by application status

**Returns**: List of users with pagination info

**Use Case**: Browse all users or filter by status

---

## 🟢 Card Management Tools

### 5. `create_virtual_card`
**Purpose**: Create a virtual card for a user with spending limits

**Parameters**:
- `userId` (string, required): The Rain user ID
- `limitAmount` (number, required): Spending limit in cents (e.g., 10000 = $100.00)
- `limitFrequency` (enum, required): How often limit applies (default: perAuthorization)
- `displayName` (string, optional): Display name for the card
- `status` (enum, optional): Initial status (default: active)

**Returns**: Created card details

**Use Case**: Create card for making purchases

---

### 6. `get_user_cards`
**Purpose**: Get all cards for a specific user

**Parameters**:
- `userId` (string, required): The Rain user ID

**Returns**: Array of user's cards

**Use Case**: See existing cards before creating new one

---

### 7. `get_card_details`
**Purpose**: Get detailed information about a specific card

**Parameters**:
- `cardId` (string, required): The Rain card ID

**Returns**: Card details including status and limits

**Use Case**: Check card information

---

### 8. `get_card_payment_details`
**Purpose**: Get card number (PAN) and CVC for payment

**Parameters**:
- `cardId` (string, required): The Rain card ID
- `userId` (string, required): The Rain user ID

**Returns**: PAN, CVC, and billing address

**Use Case**: Complete a purchase (use only when ready to pay)

**⚠️ Warning**: Only request when ready to make payment

---

### 9. `update_card_status`
**Purpose**: Update card status (lock/unlock/cancel)

**Parameters**:
- `cardId` (string, required): The Rain card ID
- `status` (enum, required): New status (notActivated, active, locked, canceled)

**Returns**: Updated card status

**Use Case**: Lock card after purchase, unlock for reuse, or cancel permanently

---

### 10. `update_card_limit`
**Purpose**: Update spending limit for a card

**Parameters**:
- `cardId` (string, required): The Rain card ID
- `limitAmount` (number, required): New limit in cents
- `limitFrequency` (enum, required): How often limit applies

**Returns**: Updated limit information

**Use Case**: Adjust limits if purchase amount changes

---

### 11. `get_card_from_rain`
**Purpose**: Get fresh card data directly from Rain API

**Parameters**:
- `cardId` (string, required): The Rain card ID

**Returns**: Fresh card data from API

**Use Case**: Get most up-to-date card information

---

### 12. `list_all_cards`
**Purpose**: List all cards in the database

**Parameters**:
- `limit` (number, optional): Max cards to return (default: 50, max: 100)
- `status` (enum, optional): Filter by status
- `type` (enum, optional): Filter by type (virtual/physical)

**Returns**: List of cards with pagination info

**Use Case**: Browse all cards across all users

---

## 🟡 Financial Tools

### 13. `get_user_balance`
**Purpose**: Get balance and credit limit information

**Parameters**:
- `userId` (string, required): The Rain user ID

**Returns**: Credit limit, available credit, charges, balance due

**Use Case**: Check available credit before creating card

---

## 🟠 Contract Tools

### 14. `get_user_contracts`
**Purpose**: Get all collateral contracts for a user

**Parameters**:
- `userId` (string, required): The Rain user ID

**Returns**: Array of contracts with token details

**Use Case**: Check collateral setup

---

### 15. `create_user_contract`
**Purpose**: Create a collateral contract for a user

**Parameters**:
- `userId` (string, required): The Rain user ID
- `chainId` (number, required): Blockchain chain ID (e.g., 1 for Ethereum)

**Returns**: Created contract details

**Use Case**: Setup collateral for credit

---

## 🔄 Common Workflows

### Complete Purchase Flow
1. `get_user_balance` - Check available credit
2. `create_virtual_card` - Create card with purchase amount limit
3. `get_card_payment_details` - Get PAN/CVC
4. Make payment with card details
5. `update_card_status` - Lock card after purchase

### User Onboarding Flow
1. `initiate_user_application` - Create application
2. User completes application via link
3. `get_user_by_email` - Verify user is approved
4. `create_user_contract` - Setup collateral (if needed)
5. `create_virtual_card` - Create first card

### Card Management Flow
1. `get_user_cards` - List user's cards
2. `get_card_details` - Check specific card
3. `update_card_limit` - Adjust limits as needed
4. `update_card_status` - Manage card lifecycle

---

## 📝 Notes

- **Test Mode**: When `USE_TEST_CARDS=true`, card creation returns test card details
- **Data Sources**: Some tools use Convex (cached), others use Rain API (fresh)
- **Error Handling**: All tools return descriptive error messages
- **Pagination**: List tools support limit parameters

---

## 🚀 Quick Reference

**Most Used Tools**:
- `create_virtual_card` - Create cards
- `get_card_payment_details` - Get payment info
- `get_user_balance` - Check credit
- `update_card_status` - Manage cards

**User Management**:
- `initiate_user_application` - Onboard users
- `get_user_by_email` - Find users

**Advanced**:
- `get_user_contracts` - Check collateral
- `create_user_contract` - Setup collateral

