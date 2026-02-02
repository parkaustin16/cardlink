# CardMart - Trading Card Marketplace

A modern web marketplace for trading cards built with Next.js, Node.js, and Supabase.

## Features

- 🎴 **Browse & Search**: Explore trading cards from various games
- 🔍 **Advanced Filtering**: Filter by game, rarity, and search by name
- 🔐 **Authentication**: Secure user authentication with Supabase Auth
- 💰 **Sell Cards**: List your cards for sale with detailed information
- 👤 **User Profiles**: Manage your listings from your profile page
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🌙 **Dark Mode**: Support for light and dark themes

## Tech Stack

- **Frontend**: Next.js 16 (React 19) with TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Node.js with Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Prerequisites

- Node.js 20+ installed
- A Supabase account and project

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/parkaustin16/cardmart.git
cd cardmart
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Supabase

#### Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the project to be set up

#### Set up the Database

1. In your Supabase project dashboard, go to the SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL script in the SQL Editor

This will create:
- `cards` table for storing trading card listings
- `profiles` table for user profiles (optional extension)
- Necessary indexes for performance
- Row Level Security (RLS) policies
- Automatic timestamp triggers

#### Configure Environment Variables

1. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

2. Update `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under Settings → API.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
cardmart/
├── src/
│   ├── app/                  # Next.js app directory
│   │   ├── auth/            # Authentication pages
│   │   ├── card/[id]/       # Card detail page
│   │   ├── marketplace/     # Marketplace listing page
│   │   ├── profile/         # User profile page
│   │   ├── sell/            # Sell card form page
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/          # Reusable components
│   │   ├── CardItem.tsx     # Card display component
│   │   └── Navbar.tsx       # Navigation bar
│   └── lib/                 # Utility functions
│       └── supabase.ts      # Supabase client & types
├── supabase/
│   └── schema.sql           # Database schema
└── public/                  # Static assets
```

## Usage

### For Buyers

1. Browse the marketplace at `/marketplace`
2. Use filters to find specific cards
3. Click on a card to view details
4. Contact sellers to make purchases

### For Sellers

1. Sign up or log in at `/auth/signup` or `/auth/login`
2. Navigate to `/sell` to list a new card
3. Fill in card details (name, game, rarity, condition, price)
4. View your listings on your profile page at `/profile`
5. Delete listings from the card detail page

## Database Schema

### Cards Table

- `id`: UUID (Primary Key)
- `name`: Card name
- `description`: Card description
- `game`: Game the card belongs to
- `rarity`: Card rarity (Common, Uncommon, Rare, etc.)
- `condition`: Card condition (Near Mint, Lightly Played, etc.)
- `price`: Selling price in USD
- `image_url`: Optional image URL
- `seller_id`: Reference to the user who listed the card
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Building for Production

```bash
npm run build
npm start
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please open an issue on GitHub.
