-- Trading Cards Marketplace Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  game VARCHAR(100) NOT NULL,
  rarity VARCHAR(50) NOT NULL,
  condition VARCHAR(50) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on seller_id for faster queries
CREATE INDEX IF NOT EXISTS idx_cards_seller_id ON cards(seller_id);

-- Create index on game for faster filtering
CREATE INDEX IF NOT EXISTS idx_cards_game ON cards(game);

-- Create index on rarity for faster filtering
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to view cards
CREATE POLICY "Cards are viewable by everyone" 
  ON cards FOR SELECT 
  USING (true);

-- Allow authenticated users to insert their own cards
CREATE POLICY "Users can insert their own cards" 
  ON cards FOR INSERT 
  WITH CHECK (auth.uid() = seller_id);

-- Allow users to update their own cards
CREATE POLICY "Users can update their own cards" 
  ON cards FOR UPDATE 
  USING (auth.uid() = seller_id);

-- Allow users to delete their own cards
CREATE POLICY "Users can delete their own cards" 
  ON cards FOR DELETE 
  USING (auth.uid() = seller_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cards_updated_at 
  BEFORE UPDATE ON cards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create user profiles table (optional, extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
