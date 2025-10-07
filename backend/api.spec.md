# Cat-Bit Game Store API Specification

## Overview
Cat-Bit is a game store platform with user authentication, game management, shopping cart, wallet system, and discount codes.

## Base URL
```
http://localhost:3000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Authentication Routes (`/auth`)

#### Register User
- **Method:** POST
- **Endpoint:** `/auth/register`
- **Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** User object

#### Login User
- **Method:** POST
- **Endpoint:** `/auth/login`
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:** User object + JWT token

#### Get Current User
- **Method:** GET
- **Endpoint:** `/auth/me`
- **Auth:** Required
- **Response:** Current user object

#### Update Profile
- **Method:** PUT
- **Endpoint:** `/auth/update`
- **Auth:** Required
- **Body:** Any combination of:
  ```json
  {
    "username": "string",
    "email": "string",
    "profileImage": "string"
  }
  ```
- **Response:** Updated user object

#### Delete Account
- **Method:** DELETE
- **Endpoint:** `/auth/delete`
- **Auth:** Required
- **Response:** Success message

### Game Routes (`/games`)

#### Get Games
- **Method:** GET
- **Endpoint:** `/games`
- **Query Params:** `name`, `type`, `minPrice`, `maxPrice`
- **Response:** Array of games with ranking

#### Get User Library
- **Method:** GET
- **Endpoint:** `/games/library`
- **Auth:** Required
- **Response:** Array of purchased games

#### Get Single Game
- **Method:** GET
- **Endpoint:** `/games/:id`
- **Response:** Game object

#### Create Game (Admin)
- **Method:** POST
- **Endpoint:** `/games`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "name": "string",
    "price": "number",
    "type": "string",
    "description": "string"
  }
  ```
- **Response:** Created game object

#### Update Game (Admin)
- **Method:** PUT
- **Endpoint:** `/games/:id`
- **Auth:** Admin required
- **Body:** Same as create
- **Response:** Updated game object

#### Delete Game (Admin)
- **Method:** DELETE
- **Endpoint:** `/games/:id`
- **Auth:** Admin required
- **Response:** Success message

#### Upload Game Image (Admin)
- **Method:** POST
- **Endpoint:** `/games/:id/upload-image`
- **Auth:** Admin required
- **Content-Type:** multipart/form-data
- **Body:** `image` file
- **Response:** Game object with image URL

### Cart Routes (`/cart`)

#### Get Cart
- **Method:** GET
- **Endpoint:** `/cart`
- **Auth:** Required
- **Response:** Cart with items, total, discount

#### Add to Cart
- **Method:** POST
- **Endpoint:** `/cart/add`
- **Auth:** Required
- **Body:**
  ```json
  {
    "gameId": "number"
  }
  ```
- **Response:** Updated cart

#### Remove from Cart
- **Method:** DELETE
- **Endpoint:** `/cart/remove/:gameId`
- **Auth:** Required
- **Response:** Updated cart

#### Apply Discount
- **Method:** POST
- **Endpoint:** `/cart/discount`
- **Auth:** Required
- **Body:**
  ```json
  {
    "code": "string"
  }
  ```
- **Response:** Cart with discount applied

#### Checkout
- **Method:** POST
- **Endpoint:** `/cart/checkout`
- **Auth:** Required
- **Body:**
  ```json
  {
    "gameIds": ["number"],
    "discountCode": "string"
  }
  ```
- **Response:** Purchase confirmation

#### Clear Cart
- **Method:** DELETE
- **Endpoint:** `/cart/clear`
- **Auth:** Required
- **Response:** Empty cart

### Wallet Routes (`/wallet`)

#### Get Balance
- **Method:** GET
- **Endpoint:** `/wallet/balance`
- **Auth:** Required
- **Response:** `{ "balance": number }`

#### Top Up Wallet
- **Method:** POST
- **Endpoint:** `/wallet/topup`
- **Auth:** Required
- **Body:**
  ```json
  {
    "amount": "number"
  }
  ```
- **Response:** Updated balance

#### Get Transaction History
- **Method:** GET
- **Endpoint:** `/wallet/transactions`
- **Auth:** Required
- **Response:** Array of transactions

### Discount Routes (`/discount`)

#### Validate Discount Code
- **Method:** POST
- **Endpoint:** `/discount/validate`
- **Auth:** Required
- **Body:**
  ```json
  {
    "code": "string"
  }
  ```
- **Response:** `{ "valid": boolean, "discount": number }`

#### Get Available Discounts
- **Method:** GET
- **Endpoint:** `/discount/available`
- **Auth:** Required
- **Response:** Array of available discount codes

#### Get All Discounts (Admin)
- **Method:** GET
- **Endpoint:** `/discount`
- **Auth:** Admin required
- **Response:** Array of all discount codes

#### Create Discount (Admin)
- **Method:** POST
- **Endpoint:** `/discount`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "code": "string",
    "discountValue": "number",
    "maxUsage": "number",
    "expireDate": "date"
  }
  ```
- **Response:** Created discount object

#### Update Discount (Admin)
- **Method:** PUT
- **Endpoint:** `/discount/:id`
- **Auth:** Admin required
- **Body:** Same as create
- **Response:** Updated discount object

#### Delete Discount (Admin)
- **Method:** DELETE
- **Endpoint:** `/discount/:id`
- **Auth:** Admin required
- **Response:** Success message

### Admin Routes (`/admin`)

#### Get All Users
- **Method:** GET
- **Endpoint:** `/admin/users`
- **Auth:** Admin required
- **Response:** Array of users

#### Get User Transactions
- **Method:** GET
- **Endpoint:** `/admin/users/:userId/transactions`
- **Auth:** Admin required
- **Response:** Array of user transactions

#### Update User Role
- **Method:** PUT
- **Endpoint:** `/admin/users/:userId/role`
- **Auth:** Admin required
- **Body:**
  ```json
  {
    "role": "user|admin"
  }
  ```
- **Response:** Updated user object

#### Delete User
- **Method:** DELETE
- **Endpoint:** `/admin/users/:userId`
- **Auth:** Admin required
- **Response:** Success message

#### Get Dashboard Stats
- **Method:** GET
- **Endpoint:** `/admin/stats`
- **Auth:** Admin required
- **Response:** Dashboard statistics

### Health Check
- **Method:** GET
- **Endpoint:** `/health`
- **Response:** `{ "status": "OK", "timestamp": "ISO string" }`

## Error Responses
- **400 Bad Request:** Invalid input data
- **401 Unauthorized:** Missing or invalid authentication
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **500 Internal Server Error:** Server error

## Data Types

### User
```json
{
  "id": "number",
  "username": "string",
  "email": "string",
  "role": "user|admin",
  "profile_image": "string",
  "wallet_balance": "number",
  "created_at": "date"
}
```

### Game
```json
{
  "id": "number",
  "name": "string",
  "price": "number",
  "type": "string",
  "description": "string",
  "image": "string",
  "releaseDate": "date",
  "salesCount": "number",
  "rank": "number"
}
```

### Cart
```json
{
  "items": [
    {
      "game": "Game",
      "quantity": "number"
    }
  ],
  "total": "number",
  "discountCode": "string",
  "discountAmount": "number"
}
```