
# Detected Pro API Dependencies

The following features in the open-source version currently depend on the Commercial Version API (`/proApi`). These features will not work out-of-the-box in the self-hosted open-source version without local implementation.

## Critical / High Visibility
These features appear in common UI flows and may cause errors if not handled.

- **App Collaborators**: `core/app/collaborator/*` (Implemented local fix)
- **Team Groups**: `support/user/team/group/*` (Implemented local mock for list)
- **Team Organizations**: `support/user/team/org/*` (Implemented local mock for list)
- **Team Member List**: `support/user/team/member/list` (Implemented local fix)

## User Account & Authentication
- **OAuth Login**: `support/user/account/login/oauth`
- **WeChat Login**: `support/user/account/login/wx/*`
- **Fast Login**: `support/user/account/login/fastLogin`
- **SSO**: `support/user/account/sso`
- **Register (Email/Phone)**: `support/user/account/register/emailAndPhone`
- **Update Password by Code**: `support/user/account/password/updateByCode`

## Billing & Wallet
- **Bill List/Create**: `support/wallet/bill/*`
- **Invoice Management**: `support/wallet/bill/invoice/*`
- **Usage Statistics**: `support/wallet/usage/*`
- **Coupon Redemption**: `support/wallet/coupon/redeem`

## System & Notifications
- **System Informs**: `support/user/inform/*` (Read/List/Count)
- **Log/Audit**: `support/user/audit/list`
- **Custom Domain**: `support/customDomain/*`

## Notes
- **Implemented Fixes**: The "Critical" items regarding Team Member management and App Collaboration have been patched locally in your deployment.
- **Mocked Items**: Group and Org lists are mocked to return empty lists to prevent UI errors.
- **Remaining Items**: Features like Billing, advanced OAuth, and System Informs remain disabled (or will error if accessed).
