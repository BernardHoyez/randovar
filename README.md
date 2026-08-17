# Randonner VAR

Site statique du club de randonnée, présentant les randonnées du Var (crêtes
calcaires, garrigue, gorges, calanques) sous forme de vignettes avec liens
Visite / KML / GPX. Conçu sur le même principe que
[rollevillerando](https://bernardhoyez.github.io/rollevillerando), pour être
déployé sur **GitHub Pages** à l'adresse :

```
https://BernardHoyez.github.io/randovar
```

## Structure

```
randovar/
├── index.html
├── style.css
├── app.js
├── manifest.json
├── sw.js
├── randonnees.json          ← liste ordonnée des dossiers de randonnées
├── randonnees/
│   └── <nom-du-dossier>/
│       ├── rando.json        ← métadonnées de la randonnée
│       ├── vignette.jpg
│       ├── visite.html       ← export "Visite" de geotour
│       ├── trace.kml
│       └── trace.gpx
├── icons/
└── images/
    └── hero.jpg              ← bandeau de la page d'accueil
```

## Ajouter une randonnée

1. Dans **geotour** (bernardhoyez.github.io/geotour), préparez la visite puis :
   - onglet **Visite** → bouton *Exporter HTML* → fichier `visite.html`
   - onglet **Déploiement** → export du paquet → dézippez pour récupérer
     les fichiers `.kml` et `.gpx`
2. Créez un nouveau dossier dans `randonnees/`, par exemple
   `randonnees/gorges-du-verdon/`.
3. Placez-y `visite.html`, le `.kml`, le `.gpx`, et une photo `vignette.jpg`
   (format paysage, ratio 3:2 conseillé).
4. Créez `rando.json` dans ce même dossier :

   ```json
   {
     "titre": "Gorges du Verdon",
     "vignette": "vignette.jpg",
     "visite": "visite.html",
     "kml": "trace.kml",
     "gpx": "trace.gpx",
     "distance": "12 km",
     "duree": "4h",
     "denivele": "450 m"
   }
   ```

   `distance`, `duree` et `denivele` sont optionnels — omettez les champs
   que vous ne souhaitez pas afficher.

5. Ajoutez le nom du dossier dans `randonnees.json` (l'ordre du tableau
   fixe l'ordre d'affichage sur le site) :

   ```json
   [
     "randonnees/gorges-du-verdon",
     "randonnees/sentier-des-cretes-exemple"
   ]
   ```

6. **Supprimez le dossier d'exemple** `randonnees/sentier-des-cretes-exemple/`
   (et sa ligne dans `randonnees.json`) une fois votre première vraie
   randonnée ajoutée.

Aucune étape de build n'est nécessaire : la page découvre automatiquement
les randonnées listées dans `randonnees.json` au chargement.

## Mettre à jour le cache (service worker)

Le fichier `sw.js` suit un versioning « brise-cache » : à chaque
modification d'un fichier statique (HTML/CSS/JS), incrémentez la constante
en tête de fichier :

```js
const CACHE_NAME = 'randovar-cache-v2'; // v1 → v2, etc.
```

Cela force la purge de l'ancien cache et le rechargement de la nouvelle
version chez les visiteurs, sans qu'ils aient besoin de vider leur cache
manuellement.

## Déploiement sur GitHub Pages

1. Créez le dépôt `randovar` sur le compte `BernardHoyez` (GitHub).
2. Poussez l'ensemble de ce dossier à la racine du dépôt, sur la branche
   `main`.
3. Dans **Settings → Pages**, choisissez la source *Deploy from a branch*,
   branche `main`, dossier `/ (root)`.
4. Le site est publié à `https://BernardHoyez.github.io/randovar`.

```bash
cd randovar
git init
git add .
git commit -m "Site initial Randonner VAR"
git branch -M main
git remote add origin https://github.com/BernardHoyez/randovar.git
git push -u origin main
```

## Identité visuelle

- **Palette** : calcaire (`#EAE4D6`), garrigue (`#47563A`), ocre du sentier
  (`#C17A3D`), ciel de Provence (`#5B85A6`), soleil (`#D9A441`).
- **Typographies** : Bitter (titres, esprit pierre taillée), Work Sans
  (texte courant), IBM Plex Mono (distance / durée / dénivelé).
- **Élément signature** : liseré en forme de crête calcaire sous le
  bandeau photo, écho du relief du département.
