import mongoose from 'mongoose';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { WalletEntry } from '../models/WalletEntry';
import { Tag } from '../models/Tag';
import bcrypt from 'bcryptjs';
import { isNil } from 'lodash';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Direct database connection for seeding
async function connectDB() {
  const connectionString = process.env.MDB_MCP_CONNECTION_STRING;
  console.log('connectionString: ', connectionString);
  if(isNil(connectionString)) throw new Error("Invalid MongoDB URI")
  await mongoose.connect(connectionString);
}

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

async function seedDatabase() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out if you don't want to clear)
    await User.deleteMany({});
    await Wallet.deleteMany({});
    await WalletEntry.deleteMany({});
    console.log('Cleared existing data');

    // Create  user
    const hashedPassword = await hashPassword('123456');
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      avatar: '😀',
    });
    console.log('Created test user:', testUser.email);

    // Create test wallets for the user
    const wallet1 = await Wallet.create({
      name: 'Personal Wallet 💰',
      balance: 1500.50,
      userId: testUser._id,
      createdBy: testUser._id,
    });

    const wallet2 = await Wallet.create({
      name: 'Business Wallet 💼',
      balance: -250.75,
      userId: testUser._id,
      createdBy: testUser._id,
    });

    const wallet3 = await Wallet.create({
      name: 'Savings Account 🏦',
      balance: 5000.00,
      userId: testUser._id,
      createdBy: testUser._id,
    });

    console.log('Created test wallets:', [wallet1.name, wallet2.name, wallet3.name]);

    // Create predefined tags
    const predefinedTags = [
      { title: 'No idea', emoji: '🤷' },
      { title: 'Food', emoji: '🍕' },
      { title: 'Transportation', emoji: '🚗' },
      { title: 'Shopping', emoji: '🛒' },
      { title: 'Entertainment', emoji: '🎮' },
      { title: 'Health', emoji: '🏥' },
      { title: 'Education', emoji: '📚' },
      { title: 'Salary', emoji: '💰' },
      { title: 'Investment', emoji: '📈' },
      { title: 'Rent', emoji: '🏠' },
      { title: 'Utilities', emoji: '💡' },
      { title: 'Insurance', emoji: '🛡️' },
      { title: 'Travel', emoji: '✈️' },
      { title: 'Gift', emoji: '🎁' },
      { title: 'Emergency', emoji: '🚨' },
    ];

    // Clear existing tags first
    await Tag.deleteMany({});
    
    const createdTags = await Tag.insertMany(predefinedTags);
    console.log('Created predefined tags:', createdTags.length);

    // Get the "No idea" tag for default use
    const noIdeaTag = createdTags.find(tag => tag.title === 'No idea');
    const foodTag = createdTags.find(tag => tag.title === 'Food');
    const salaryTag = createdTags.find(tag => tag.title === 'Salary');
    const shoppingTag = createdTags.find(tag => tag.title === 'Shopping');

    // Create some test entries for wallet1
    const entries = [
      {
        amount: 500.00,
        type: 'add',
        description: 'Salary deposit 💰',
        walletId: wallet1._id,
        tags: salaryTag ? [salaryTag._id] : [],
      },
      {
        amount: 50.25,
        type: 'subtract',
        description: 'Grocery shopping 🛒',
        walletId: wallet1._id,
        tags: foodTag ? [foodTag._id] : [],
      },
      {
        amount: 1200.00,
        type: 'add',
        description: 'Freelance payment ✨',
        walletId: wallet1._id,
        tags: salaryTag ? [salaryTag._id] : [],
      },
      {
        amount: 149.25,
        type: 'subtract',
        description: 'Monthly subscription 📱',
        walletId: wallet1._id,
        tags: shoppingTag ? [shoppingTag._id] : [],
      },
    ];

    await WalletEntry.insertMany(entries);
    console.log('Created test wallet entries');

    console.log('\nSeeding completed successfully! 🎉');
    console.log('\nTest credentials:');
    console.log('Email: test@example.com');
    console.log('Password: 123456');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();