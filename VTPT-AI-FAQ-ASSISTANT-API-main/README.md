# AI FAQ Assistant API

The **AI FAQ Assistant API** is a robust RESTful backend application designed to enable users to create and manage FAQs while leveraging Google Gemini AI (`gemini-2.0-flash`) to generate answers to arbitrary user questions and automatically generate structured FAQ question-and-answer pairs.

The project is built using **Node.js, Express.js, MongoDB (via Mongoose), JWT Authentication, bcrypt, and the official Google Gemini SDK (`@google/genai`)**. It follows the standard **MVC (Model-View-Controller) Architecture**.

---

## Features

1.  **User Authentication**:
    *   **User Registration**: Hashes passwords securely using `bcrypt` (10 rounds) and prevents duplicate email registration.
    *   **User Login**: Authenticates credentials and issues secure JWT tokens.
    *   **User Profile**: Private endpoint to retrieve details of the currently logged-in user.
2.  **FAQ Management**:
    *   **Full CRUD Operations**: Private endpoints for creating, updating, and deleting FAQs (with owner verification), and public endpoints for reading them.
    *   **Category Constraints**: Valid categories are strictly validated: `Technology`, `Education`, `Health`, `Banking`, `General`.
3.  **AI Answer Generator (Google Gemini)**:
    *   **Answer Endpoint**: Provides direct, concise answers using the state-of-the-art `gemini-2.0-flash` model.
4.  **AI FAQ Generator (Google Gemini)**:
    *   **Structured FAQ Generation**: Takes a topic and generates a perfectly structured FAQ pair (`question` & `answer`) using Gemini's Structured JSON outputs (guaranteeing exact schema compliance).
5.  **FAQ Search**:
    *   **Regex Keyword Search**: Efficiently searches across questions, answers, and categories using MongoDB regex matching.
6.  **Security**:
    *   JWT Token verification middleware.
    *   Input validation before controller handling.
    *   Centralized error handling middleware covering Mongoose validations, CastErrors, and duplicate key issues.

---

## Directory Structure

```
src/
├── config/
│   └── db.js                 # MongoDB connection configuration
├── controllers/
│   ├── aiController.js       # Bridges Gemini API services with requests
│   ├── authController.js     # Manages registration, login, and profiles
│   └── faqController.js      # Handles FAQ CRUD and search operations
├── middleware/
│   ├── authMiddleware.js     # JWT token verification
│   ├── errorMiddleware.js    # Formats and returns centralized errors
│   └── validationMiddleware.js # Sanitizes and validates request bodies
├── models/
│   ├── FAQ.js                # FAQ database schema & rules
│   └── User.js               # User database schema & password hashing
├── routes/
│   ├── aiRoutes.js           # Router configuration for AI endpoints
│   ├── authRoutes.js         # Router configuration for auth endpoints
│   └── faqRoutes.js          # Router configuration for FAQ endpoints
├── services/
│   └── geminiService.js      # Manages Google Gen AI SDK integration
├── utils/
│   └── helpers.js            # General backend helper utilities
├── app.js                    # Express app configuration
└── server.js                 # Database connection and server listener
```

---

## Installation & Setup

### 1. Prerequisites
*   **Node.js**: Version 18+ or 20+
*   **MongoDB**: Local installation or MongoDB Atlas cluster connection string
*   **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. Install Dependencies
Clone or copy the project files to your directory and run:
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (or use the provided template):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ai_faq_assistant
JWT_SECRET=your_jwt_secret_key_here_must_be_long_and_secure
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 4. Run the Application
*   **Development Mode** (auto-reloads on changes using native Node.js watch flag):
    ```bash
    npm run dev
    ```
*   **Production Mode**:
    ```bash
    npm start
    ```

---

## API Reference

### 1. Authentication
*   **Register User** (`POST /api/auth/register`)
    *   *Payload*: `{ "name": "John Doe", "email": "john@gmail.com", "password": "123456" }`
*   **Login User** (`POST /api/auth/login`)
    *   *Payload*: `{ "email": "john@gmail.com", "password": "123456" }`
    *   *Returns*: User object + JWT `token`.
*   **Get Profile** (`GET /api/auth/profile`) - *Protected*
    *   *Header*: `Authorization: Bearer <token>`

### 2. FAQ Management
*   **Create FAQ** (`POST /api/faqs`) - *Protected*
    *   *Payload*: `{ "question": "What is Node?", "answer": "Node is a JS runtime.", "category": "Technology" }`
*   **Get All FAQs** (`GET /api/faqs`)
*   **Get FAQ by ID** (`GET /api/faqs/:id`)
*   **Update FAQ** (`PUT /api/faqs/:id`) - *Protected (Creator only)*
    *   *Payload*: `{ "question": "Updated Question", "answer": "Updated Answer" }`
*   **Delete FAQ** (`DELETE /api/faqs/:id`) - *Protected (Creator only)*
*   **Search FAQs** (`GET /api/faqs/search?q=query_string`)
    *   *Query Parameters*: `q` (keyword search)

### 3. AI Services (Protected)
*   **AI Answer Generator** (`POST /api/ai/answer`)
    *   *Payload*: `{ "question": "What is Artificial Intelligence?" }`
    *   *Response*: `{ "success": true, "answer": "..." }`
*   **AI FAQ Generator** (`POST /api/ai/generate-faq`)
    *   *Payload*: `{ "topic": "MongoDB" }`
    *   *Response*: `{ "success": true, "question": "...", "answer": "..." }`
    *   *Note*: The returned question-answer pair can be stored by passing it to the `POST /api/faqs` endpoint.

---

## Testing with Postman

An pre-configured Postman Collection is included in the project root:
*   **File**: `AI_FAQ_Assistant_API.postman_collection.json`
*   **Import**: Import this file directly into Postman.
*   **Environment Setup**: It defines two collection variables:
    *   `baseUrl`: Defaulted to `http://localhost:5000`
    *   `token`: Left blank initially.
*   **Automatic JWT Token Saving**: The **User Login** request contains a test script that automatically extracts the JWT token upon a successful response and updates the collection's `token` variable. Subsequent protected requests will automatically read from `{{token}}` in their Authorization tab.
