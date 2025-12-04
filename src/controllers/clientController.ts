import { Request, Response } from 'express';
import Client from '../models/Client';

interface AuthRequest extends Request {
  user?: any;
}

export const getClient = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};