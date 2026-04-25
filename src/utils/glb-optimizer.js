const fs = require('fs');
const path = require('path');

/**
 * Optimisation simple de fichiers GLB
 * Réduit la taille en supprimant les données non essentielles
 */
function optimizeGLB(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Pour une vraie optimisation, utiliser gltf-pipeline ou similar
    // Ici on fait juste une copie avec vérification de base

    if (!fs.existsSync(inputPath)) {
      return reject(new Error('Fichier source introuvable'));
    }

    const stats = fs.statSync(inputPath);
    if (stats.size > 10 * 1024 * 1024) { // 10MB
      return reject(new Error('Fichier trop volumineux (max 10MB)'));
    }

    // Copie simple (dans un vrai projet, utiliser une vraie optimisation GLB)
    fs.copyFile(inputPath, outputPath, (err) => {
      if (err) reject(err);
      else resolve(outputPath);
    });
  });
}

/**
 * Génération de miniature depuis un fichier GLB
 * Utilise une approche simplifiée
 */
function generateThumbnail(glbPath, thumbnailPath) {
  return new Promise((resolve, reject) => {
    // Dans un vrai projet, utiliser three.js côté serveur ou un service externe
    // Ici on crée juste une miniature placeholder

    const placeholderSvg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f1f5f9"/>
      <text x="200" y="140" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748b">
        Aperçu 3D
      </text>
      <text x="200" y="165" text-anchor="middle" font-family="Arial" font-size="12" fill="#94a3b8">
        ${path.basename(glbPath)}
      </text>
      <circle cx="200" cy="200" r="30" fill="#e11d48" opacity="0.2"/>
      <path d="M185 200 L200 185 L215 200 L200 215 Z" fill="#e11d48"/>
    </svg>`;

    fs.writeFile(thumbnailPath, placeholderSvg, (err) => {
      if (err) reject(err);
      else resolve(thumbnailPath);
    });
  });
}

module.exports = { optimizeGLB, generateThumbnail };