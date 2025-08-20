import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // Common Fields
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'business', 'admin'],
      default: 'user',
    },

    // Business-specific Fields (only used if role === 'business')
    businessName: {
      type: String,
    },
    category: {
      type: String,
    },
    address: {
      type: String,
    },
    description: {
      type: String,
    },
    departments: {
      type: [String],
    },
    openingHours: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
