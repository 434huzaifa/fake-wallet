# 💰 Fake Wallet

A fun project for building a fake wallet system to practice full-stack development. Built with VS Code and GitHub Copilot using MCP (Model Context Protocol) - total development cost ~$1.60 over 1.5 days. 

## ✨ Key Features

• JWT-based authentication with HTTP-only cookies
• Emoji avatar customization
• Profile management with account deletion
• Create wallets with custom icons & colors
• Balance tracking (supports negative balances)
• Transaction history with pagination
• Role-based wallet sharing (Owner/Partner/Viewer)
• Invitation system for wallet access
• Permission-based access control
• Add, edit, and soft-delete transactions
• Tag-based categorization with predefined tags
• Live updates across wallet views
• Responsive design with Ant Design components
• Asia/Dhaka timezone consistency

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - App Router with TypeScript
- **React 18** - Modern hooks & functional components
- **Redux Toolkit** - State management
- **Ant Design** - UI component library
- **TailwindCSS** - Utility-first styling

### Backend
- **Next.js API Routes** - Serverless backend
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - Secure authentication
- **Zod** - Runtime validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- MongoDB Atlas account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/434huzaifa/fake-wallet.git
   cd fake-wallet
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your MongoDB connection string and JWT secret:
   ```env
   MDB_MCP_CONNECTION_STRING=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Seed the database** *(Optional)*
   ```bash
   pnpm seed
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see your application! 🎉

## 🧪 Test Account

Use these credentials to explore the app:
- **Email**: `test@example.com`
- **Password**: `123456`

##  Deployment

This app is ready for deployment on Vercel:

```bash
pnpm build
```

## 📄 License

MIT License - feel free to use this project for learning and development!

---

<div align="center">
  <p>Built with ❤️ using Next.js & TypeScript</p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
