import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const register = async (req: Request, res: Response) => {
  try {
    const { nom, email, motDePasse, telephone, adresse, userType = 'client' } = req.body;
    
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }
    
    const hashedPassword = await bcrypt.hash(motDePasse, 12);
    
    const user = new User({
      nom, 
      email, 
      motDePasse: hashedPassword, 
      telephone, 
      adresse,
      roles: [userType]
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, roles: user.roles },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      userId: user._id,
      roles: user.roles,
      user: { id: user._id, nom, email, roles: user.roles }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, motDePasse } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    const token = jwt.sign(
      { userId: user._id, roles: user.roles },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      userId: user._id,
      roles: user.roles,
      user: { id: user._id, nom: user.nom, email, roles: user.roles }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};