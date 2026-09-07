// Randonner VAR — découverte automatique des randonnées
// Lit randonnees.json (liste ordonnée de dossiers), puis un rando.json par dossier.
// Chaque rando.json : { "titre": "...", "vignette": "...", "visite": "...",
//                        "kml": "...", "gpx": "...", "distance": "...",
//                        "duree": "...", "denivele": "..." }
// distance / duree / denivele sont optionnels.
//
// Carte de synthèse : la position de chaque marqueur est lue directement
// dans le fichier .kml déjà publié pour les liens Visite/KML/GPX (premier
// point du tracé) — aucune coordonnée n'est dupliquée ni saisie à la main.

const NB_RANDOS_AFFICHEES = 10;

(async function () {
  const conteneur = document.getElementById('liste-randonnees');
  const etat = document.getElementById('etat-chargement');
  const tpl = document.getElementById('tpl-carte');

  function viderEtat() {
    if (etat && etat.parentNode) etat.remove();
  }

  function afficherMessage(texte, classe) {
    viderEtat();
    const p = document.createElement('p');
    p.className = classe;
    p.textContent = texte;
    conteneur.appendChild(p);
  }

  function slugDossier(dossier) {
    return dossier.split('/').filter(Boolean).pop();
  }

  function construireMeta(rando) {
    const morceaux = [];
    if (rando.distance) morceaux.push(rando.distance);
    if (rando.duree) morceaux.push(rando.duree);
    if (rando.denivele) morceaux.push('D+ ' + rando.denivele);
    return morceaux.join('  ·  ');
  }

  function creerCarte(dossier, rando) {
    const noeud = tpl.content.cloneNode(true);
    const visiteHref = dossier + '/' + rando.visite;

    const article = noeud.querySelector('.carte');
    if (article) article.id = 'rando-' + slugDossier(dossier);

    const lienImg = noeud.querySelector('[data-role="visite-lien"]');
    lienImg.href = visiteHref;
    lienImg.setAttribute('aria-label', 'Ouvrir la visite : ' + rando.titre);

    const img = noeud.querySelector('[data-role="vignette"]');
    img.src = dossier + '/' + rando.vignette;
    img.alt = rando.titre;

    noeud.querySelector('[data-role="titre"]').textContent = rando.titre;

    const meta = noeud.querySelector('[data-role="meta"]');
    const texteMeta = construireMeta(rando);
    if (texteMeta) {
      meta.textContent = texteMeta;
    } else {
      meta.remove();
    }

    const lienVisite = noeud.querySelector('[data-role="visite-lien-2"]');
    lienVisite.href = visiteHref;

    const lienKml = noeud.querySelector('[data-role="kml-lien"]');
    if (rando.kml) {
      lienKml.href = dossier + '/' + rando.kml;
    } else {
      lienKml.remove();
    }

    const lienGpx = noeud.querySelector('[data-role="gpx-lien"]');
    if (rando.gpx) {
      lienGpx.href = dossier + '/' + rando.gpx;
    } else {
      lienGpx.remove();
    }

    return noeud;
  }

  // Fait défiler la page jusqu'à la fiche d'une randonnée et la surligne
  // brièvement ; si cette randonnée n'est pas dans les dernières affichées
  // (donc absente de la liste), ouvre directement sa visite.
  function ouvrirFiche(slug, visiteHref) {
    const carte = document.getElementById('rando-' + slug);
    if (carte) {
      carte.scrollIntoView({ behavior: 'smooth', block: 'center' });
      carte.classList.add('carte--surlignee');
      setTimeout(() => carte.classList.remove('carte--surlignee'), 1800);
    } else {
      window.location.href = visiteHref;
    }
  }

  let valides = [];

  try {
    const reponseListe = await fetch('randonnees.json', { cache: 'no-store' });
    if (!reponseListe.ok) throw new Error('randonnees.json introuvable');
    const dossiers = await reponseListe.json();

    if (!Array.isArray(dossiers) || dossiers.length === 0) {
      afficherMessage('Aucune randonnée publiée pour le moment.', 'liste__vide');
      initCarte([]);
      return;
    }

    const resultats = await Promise.all(
      dossiers.map(async (dossier) => {
        try {
          const rep = await fetch(dossier + '/rando.json', { cache: 'no-store' });
          if (!rep.ok) throw new Error('rando.json manquant pour ' + dossier);
          const rando = await rep.json();
          return { dossier, rando };
        } catch (err) {
          console.warn('Randonnée ignorée (' + dossier + ') :', err.message);
          return null;
        }
      })
    );

    viderEtat();

    valides = resultats.filter(Boolean);
    if (valides.length === 0) {
      afficherMessage('Aucune randonnée publiée pour le moment.', 'liste__vide');
      initCarte([]);
      return;
    }

    // On n'affiche que les N dernières randonnées dans la liste (l'ordre
    // du tableau randonnees.json va de la plus ancienne à la plus récente),
    // pour éviter de saturer la page d'accueil. La carte, elle, montre
    // toujours l'ensemble des randonnées.
    const affichees = valides.slice(-NB_RANDOS_AFFICHEES);
    const masquees = valides.length - affichees.length;

    if (masquees > 0) {
      const note = document.createElement('p');
      note.className = 'liste__note';
      note.textContent =
        'Seules les ' + affichees.length + ' randonnées les plus récentes sont ' +
        'affichées ci-dessous — retrouvez les ' + masquees + ' plus anciennes sur la carte.';
      conteneur.appendChild(note);
    }

    affichees.forEach(({ dossier, rando }) => {
      conteneur.appendChild(creerCarte(dossier, rando));
    });
  } catch (erreur) {
    console.error(erreur);
    afficherMessage('Impossible de charger la liste des randonnées.', 'liste__erreur');
  }

  initCarte(valides);

  // ---------- Carte de synthèse ----------

  async function fetchTexte(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(url + ' → ' + res.status);
    return res.text();
  }

  // Repère, parmi tous les <coordinates> du KML, celui qui a le plus de
  // points : c'est le tracé (les Placemark isolés d'un waypoint n'ont
  // qu'une seule coordonnée chacun). Renvoie [lat, lon] du premier point.
  function pointDepartDepuisKml(kmlTexte) {
    const doc = new DOMParser().parseFromString(kmlTexte, 'text/xml');
    if (doc.querySelector('parsererror')) return null;
    const coordEls = Array.from(doc.getElementsByTagName('coordinates'));
    let meilleur = [];
    for (const el of coordEls) {
      const points = el.textContent.trim().split(/\s+/).filter(Boolean);
      if (points.length > meilleur.length) meilleur = points;
    }
    if (meilleur.length === 0) return null;
    const [lon, lat] = meilleur[0].split(',').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return [lat, lon];
  }

  // Repli si le KML est absent : premier <wpt lat lon> du GPX.
  function pointDepartDepuisGpx(gpxTexte) {
    const m = gpxTexte.match(/<wpt\s+lat="([\-0-9.]+)"\s+lon="([\-0-9.]+)"/);
    if (!m) return null;
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return [lat, lon];
  }

  function iconeMarcheur() {
    return L.divIcon({
      className: '',
      html:
        '<div class="marqueur-marcheur">' +
        '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="22" cy="8" r="3.6" fill="currentColor" stroke="none"></circle>' +
        '<path d="M18 13 L23 13 L25.5 22 L20 24.5 L15.5 21 Z" fill="currentColor" stroke="none"></path>' +
        '<path d="M18 15 L10.5 20 L7.5 28"></path>' +
        '<path d="M22.5 15 L28 12.5"></path>' +
        '<path d="M19 23.5 L13.5 30 L11 36.5"></path>' +
        '<path d="M22.5 23.5 L27.5 29.5 L26.5 36.5"></path>' +
        '</svg>' +
        '</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      tooltipAnchor: [0, -14]
    });
  }

  async function initCarte(entrees) {
    const conteneurCarte = document.getElementById('carte-ensemble');
    const etatCarte = document.getElementById('carte-etat');
    if (!conteneurCarte || typeof L === 'undefined') return;

    if (!entrees || entrees.length === 0) {
      if (etatCarte) etatCarte.textContent = 'Aucune randonnée à afficher sur la carte.';
      return;
    }

    const map = L.map(conteneurCarte, { zoomControl: true, scrollWheelZoom: false });
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());
    L.tileLayer(
      'https://data.geopf.fr/wmts?layer=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&style=normal&tilematrixset=PM&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix={z}&TileCol={x}&TileRow={y}',
      { attribution: '© IGN', maxZoom: 19 }
    ).addTo(map);

    const icone = iconeMarcheur();
    const groupe = L.featureGroup();
    let trouves = 0;

    for (const { dossier, rando } of entrees) {
      try {
        let point = null;
        if (rando.kml) {
          const texte = await fetchTexte(dossier + '/' + rando.kml);
          point = pointDepartDepuisKml(texte);
        }
        if (!point && rando.gpx) {
          const texte = await fetchTexte(dossier + '/' + rando.gpx);
          point = pointDepartDepuisGpx(texte);
        }
        if (!point) continue;

        const slug = slugDossier(dossier);
        const visiteHref = dossier + '/' + rando.visite;

        const marqueur = L.marker(point, { icon: icone });
        marqueur.bindTooltip(rando.titre, { direction: 'top', opacity: 0.95 });
        marqueur.on('click', () => ouvrirFiche(slug, visiteHref));
        marqueur.addTo(groupe);
        trouves++;
      } catch (err) {
        console.warn('Marqueur ignoré sur la carte (' + dossier + ') :', err.message);
      }
    }

    if (trouves === 0) {
      if (etatCarte) etatCarte.textContent = 'Aucun tracé exploitable pour la carte.';
      map.remove();
      return;
    }

    if (etatCarte && etatCarte.parentNode) etatCarte.remove();
    groupe.addTo(map);

    if (trouves === 1) {
      map.setView(groupe.getBounds().getCenter(), 13);
    } else {
      map.fitBounds(groupe.getBounds(), { padding: [30, 30], maxZoom: 13 });
    }
  }
})();
