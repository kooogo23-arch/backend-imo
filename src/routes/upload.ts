import express from 'express';
import { upload } from '../middleware/upload';
import { auth } from '../middleware/auth';

const router = express.Router();

// Route de test
router.get('/test', (req, res) => {
  res.json({ message: 'Upload route accessible', storage: 'local' });
});

router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({ 
      url: imageUrl,
      message: 'Image uploadée avec succès' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload', error: error instanceof Error ? error.message : 'Erreur inconnue' });
  }
});

router.post('/images', auth, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ message: 'Aucune image fournie' });
    }
    
    const imageUrls = req.files.map(file => 
      `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
    );
    
    res.json({ 
      imageUrls,
      message: `${req.files.length} images uploadées avec succès` 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload', error: error instanceof Error ? error.message : 'Erreur inconnue' });
  }
});

router.post('/video', auth, upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucune vidéo fournie' });
    }
    
    const videoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    res.json({ 
      url: videoUrl,
      videoUrl,
      message: 'Vidéo uploadée avec succès' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload', error: error instanceof Error ? error.message : 'Erreur inconnue' });
  }
});

export default router;