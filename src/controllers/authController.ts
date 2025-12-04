import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Fournisseur from '../models/Fournisseur';
import Client from '../models/Client';

export const register = async (req: Request, res: Response) => {
  try {
    const { nom, email, motDePasse, telephone, adresse, userType = 'client' } = req.body;
    
    const existingFournisseur = await Fournisseur.findOne({ email });
    const existingClient = await Client.findOne({ email });
    
    if (existingFournisseur || existingClient) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }
    
    const hashedPassword = await bcrypt.hash(motDePasse, 12);
    
    let user;
    if (userType === 'fournisseur') {
      user = new Fournisseur({
        nom, email, motDePasse: hashedPassword, telephone, adresse
      });
    } else {
      user = new Client({
        nom, email, motDePasse: hashedPassword, telephone, adresse
      });
    }
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, userType },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      userId: user._id,
      userType,
      user: { id: user._id, nom, email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, motDePasse } = req.body;
    
    let user = await Fournisseur.findOne({ email });
    let userType = 'fournisseur';
    
    if (!user) {
      user = await Client.findOne({ email });
      userType = 'client';
    }
    
    if (!user) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }
    
    const token = jwt.sign(
      { userId: user._id, userType },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      userId: user._id,
      userType,
      user: { id: user._id, nom: user.nom, email }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};