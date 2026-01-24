
// src/app/modules/auth/auth.service.ts
import { User } from '../user/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


const loginUser = async (payload: { email: string; password: string }) => {
  const { email, password } = payload;

  const user = await User.findOne({ email, isDeleted: false });
  if (!user || user.status !== 'active') {
    throw new Error('User not found or not active');
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new Error('Incorrect password');
  }

  // Generate JWT
  const token = jwt.sign(
    {
      _id: user._id,
      role: user.role,
      email: user.email,
    },
    process.env.JWT_SECRET || 'default_secret',
    { expiresIn: '7d' }
  );

  return {
    token,
    user: {
      id: user.id,
      role: user.role,
      status: user.status,
    },
  };
};

export const AuthService = {
  loginUser,
};
