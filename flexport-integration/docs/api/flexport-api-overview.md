# Flexport API Documentation Overview

## Introduction
Flexport provides comprehensive Global Logistics APIs that enable programmatic interaction with supply chain data and automate information flows. The API follows RESTful conventions and communicates using JSON.

## API Versions
- **Current Version**: v2
- **Legacy Version**: v1 (uses API Keys only)
- **Base URL**: `https://api.flexport.com`

## Authentication Methods

### 1. API Credentials (OAuth 2.0) - Recommended
API Credentials represent the modern OAuth 2.0 approach for securing access to Flexport's public API endpoints.

#### Key Features:
- Granular access control
- Selective endpoint permissions
- Bearer token authentication
- Token expires after 24 hours
- Limited to 10 token requests per day

#### Authentication Flow:
1. Create credentials in Flexport app settings
2. Select specific resource access
3. Obtain Client ID and Client Secret
4. Exchange credentials for access token
5. Use token in Authorization header

#### Token Request:
```http
POST https://api.flexport.com/oauth/token
Content-Type: application/json

{
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "audience": "https://api.flexport.com",
  "grant_type": "client_credentials"
}
```

#### Using the Token:
```http
Authorization: Bearer ACCESS_TOKEN
```

### 2. API Keys (Legacy)
- Grants access to all API endpoints
- Created in app settings
- Used with header: `Authorization: Bearer API_KEY`
- Can be revoked instantly
- **Note**: v1 API only supports API Keys

## Available APIs

### 1. Logistics API
- **Documentation**: https://docs.logistics-api.flexport.com/
- **Version**: 2023-10
- **OpenAPI Spec**: https://logistics-api.flexport.com/logistics/api/2023-10/documentation/raw

#### Key Endpoints:
- Bundles
- Inbounds
- Products
- Orders
- Reports
- Webhooks

### 2. Core API Endpoints

#### Shipments
- Track shipment milestones
- Manage shipment data
- Monitor delivery status

#### Purchase Orders
- Automate purchase order lifecycle
- Track order status
- Manage supplier relationships

#### Bookings
- Create booking requests
- Manage freight bookings
- Track booking status

#### Commercial Invoices
- Create and retrieve invoices
- Support customs clearances
- Calculate landed costs

#### Customs
- Manage customs entries
- Track clearance status
- Handle documentation

#### Documents
- Support 35+ document types
- Post and retrieve logistics documents
- Manage documentation workflows

#### Products
- Manage product library
- Track inventory
- Handle product metadata

#### Webhooks
- Real-time event notifications
- Configurable event types
- Secure webhook endpoints

## Request/Response Format

### Headers
```http
Content-Type: application/json
Authorization: Bearer TOKEN
```

### Request Format
- All requests use JSON format
- UTF-8 encoding
- RESTful conventions

### Response Format
- JSON responses
- Standard HTTP status codes
- Pagination support
- Expansion capabilities

## Rate Limits
- Token requests: 10 per day maximum
- API endpoints: Specific limits not documented (need to verify)

## Error Handling
- Standard HTTP error codes
- JSON error responses
- Detailed error messages

## Best Practices
1. **Token Management**:
   - Cache and reuse access tokens
   - Don't request new token for each API call
   - Verify token expiration before use

2. **Security**:
   - Store credentials securely
   - Use environment variables
   - Never commit credentials to version control

3. **Performance**:
   - Implement proper error handling
   - Use pagination for large datasets
   - Implement retry logic with exponential backoff

## Getting Started
1. Create a Flexport Portal account
2. Navigate to App Settings
3. Create API Credentials or API Key
4. Make your first API call

## Resources
- **API Reference**: https://apidocs.flexport.com/
- **Developer Portal**: https://developers.flexport.com/
- **Logistics API Docs**: https://docs.logistics-api.flexport.com/
- **Support**: hello@flexport.com