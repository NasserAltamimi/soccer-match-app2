"# soccer-match-app2" 
# Soccer Match App

Simple SWE381 soccer stadium reservation project using React, React Router,
Context API, Bootstrap, Express, MongoDB, Mongoose, and JWT.

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd soccer-match-app
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Install frontend dependencies:

```bash
cd ../frontend
npm install
```

4. Create the backend environment file:

```bash
cd ../backend
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

5. Open `backend/.env` and add your MongoDB connection string and JWT secret:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
```

6. Add demo data:

```bash
npm run seed
```

7. Run the backend:

```bash
npm run dev
```

8. Run the frontend in a new terminal:

```bash
cd frontend
npm run dev
```

The frontend usually runs at `http://localhost:5173`.
The backend runs at `http://localhost:5000`.

## Demo Accounts

Demo Owner:

- Email: `owner@example.com`
- Password: `123456`

Demo User:

- Email: `user@example.com`
- Password: `123456`

## Notes

- Do not commit `backend/.env`.
- Use `backend/.env.example` as the template for teammates.
- Run `npm run seed` again whenever you want to reset the demo data.
