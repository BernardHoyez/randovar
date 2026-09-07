# Randonner VAR

Site statique du club de randonnée, présentant les randonnées du Var (crêtes
calcaires, garrigue, gorges, calanques) sous forme de vignettes avec liens
Visite / KML / GPX, précédées d'une carte de synthèse. Conçu sur le même
principe que [rollevillerando](https://bernardhoyez.github.io/rollevillerando),
pour être déployé sur **GitHub Pages** à l'adresse :

```
https://BernardHoyez.github.io/randovar
```

## Structure

```
randovar/
├── index.html
├── style.css
├── app.js
├── generateur-fiche.html    ← outil interne : génère rando.json + vignette.jpg
├── manifest.json
├── sw.js
├── randonnees.json          ← liste ordonnée des dossiers de randonnées
├── randonnees/
│   └── <nom-du-dossier>/
│       ├── rando.json        ← métadonnées de la randonnée
│       ├── vignette.jpg
│       ├── <nom>.html        ← export "Déploiement" de geotour
│       ├── <nom>.kml
│       ├── <nom>.gpx
│       ├── <nom>.json
│       └── photos/
├── icons/
└── images/
    └── hero.jpg              ← bandeau de la page d'accueil
```

## Carte de synthèse et limite d'affichage

La page d'accueil affiche désormais une carte (fond IGN Plan V2) avec un
marqueur en forme de petit marcheur pour **chaque** randonnée publiée. La
position de chaque marqueur est lue directement dans le fichier `.kml` déjà
présent dans le dossier de la randonnée (premier point du tracé) — aucune
coordonnée n'est saisie à la main ni dupliquée dans `rando.json`.

Un clic sur un marqueur fait défiler la page jusqu'à la fiche correspondante
et la surligne brièvement ; si cette randonnée est trop ancienne pour figurer
dans la liste (voir ci-dessous), le clic ouvre directement sa visite.

Pour éviter de saturer la page quand le nombre de randonnées grandit, la
**liste de fiches** sous la carte n'affiche que les **10 randonnées les plus
récentes** (les dernières entrées de `randonnees.json`). La carte, elle,
continue de montrer l'ensemble des randonnées publiées. Cette limite se
règle dans `app.js` via la constante `NB_RANDOS_AFFICHEES`.

## Ajouter une randonnée (workflow simplifié)

1. Dans **geotour**, préparez la visite puis exportez le paquet depuis
   l'onglet **Déploiement** (fichier `<nom>.zip`, qui contient déjà le HTML,
   le KML, le GPX, le JSON et les photos).
2. Ouvrez **`generateur-fiche.html`** (dans ce dépôt, à ouvrir dans un
   navigateur) et déposez-y ce `<nom>.zip`.
   - La distance et le dénivelé D+ sont **calculés automatiquement** à
     partir de la trace (modifiables si besoin).
   - Une vignette par défaut est proposée (à partir de la photo utilisée
     comme aperçu dans geotour) ; vous pouvez la recadrer par glisser/zoom,
     en choisir une autre parmi les photos de la randonnée, ou en importer
     une externe.
   - Il ne reste qu'à saisir le **titre** et, si besoin, la **durée**
     (seules informations qui ne peuvent pas être déduites automatiquement).
3. Cliquez sur **Générer le dossier complet** : un `<nom>.zip` est
   téléchargé, contenant tous les fichiers du paquet geotour **plus**
   `rando.json` et `vignette.jpg` déjà prêts — plus besoin d'écrire
   `rando.json` à la main ni de recomposer une image dans un logiciel externe.
4. Extrayez ce zip et déposez le dossier `<nom>/` dans `randonnees/`.
5. Ajoutez le nom du dossier dans `randonnees.json` (l'ordre du tableau va
   de la plus ancienne à la plus récente randonnée, et fixe l'ordre
   d'affichage sur le site et des « 10 dernières ») :

   ```json
   [
     "randonnees/sentier-des-cretes-exemple",
     "randonnees/gorges-du-verdon"
   ]
   ```

Aucune étape de build n'est nécessaire : la page découvre automatiquement
les randonnées listées dans `randonnees.json` au chargement, et la carte
lit les coordonnées directement dans les `.kml` déjà présents.

### Format de `rando.json` (rappel, généré automatiquement par l'outil)

```json
{
  "titre": "Gorges du Verdon",
  "vignette": "vignette.jpg",
  "visite": "gorges-du-verdon.html",
  "kml": "gorges-du-verdon.kml",
  "gpx": "gorges-du-verdon.gpx",
  "distance": "12.4 km",
  "duree": "4 h",
  "denivele": "450 m"
}
```

`distance`, `duree` et `denivele` sont optionnels — omettez les champs que
vous ne souhaitez pas afficher.

## Mettre à jour le cache (service worker)

Le fichier `sw.js` suit un versioning « brise-cache » : à chaque
modification d'un fichier statique (HTML/CSS/JS), incrémentez la constante
en tête de fichier :

```js
const CACHE_NAME = 'randovar-cache-v3'; // v3 → v4, etc.
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
  bandeau photo, écho du relief du département ; petit marcheur stylisé
  comme marqueur sur la carte de synthèse.
