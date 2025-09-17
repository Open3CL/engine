<a id="readme-top"></a>
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![ GPL-3.0 license][license-shield]][license-url]

<br />
<div align="center">
  <a href="https://open3cl.fr">
    <img src="images/logo.png" alt="Logo" width="260" height="80">
  </a>

<h3 align="center">Open3CL</h3>
Implémentation open source du moteur Open3CL de l'ADEME.
  <p align="center">

![Javascript][Javascript]

   <br/>    
<a href="https://github.com/Open3CL/issues/new?labels=bug&template=bug-report---.md">Créer un bug</a>
    &middot;
    <a href="https://github.com/Open3CL/issues/new?labels=enhancement&template=feature-request---.md">Créer une feature</a>
  </p>
</div>

<details>
  <summary>Sommaire</summary>
  <ol>
    <li>
      <a href="#a-propos-du-projet">A propos du projet</a>
    </li>
    <li>
      <a href="#demarrage">Démarrage</a>
      <ul>
        <li><a href="#pre-requis">Pre-requis</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#documentation">Documentation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#rapports">Rapports</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contribution">Contribution</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

## A propos du projet

Open3CL est une librairie JavaScript open source, spécialement conçue pour faciliter le calcul des Diagnostics de
Performance Énergétique (DPE).
Elle implémente la norme définie
dans [l'annexe 1 de l'arrêté du 31 mars 2021](https://rt-re-batiment.developpement-durable.gouv.fr/IMG/pdf/consolide_annexe_1_arrete_du_31_03_2021_relatif_aux_methodes_et_procedures_applicables.pdf).
Elle est destinée aux développeurs qui souhaitent intégrer des calculs énergétiques précis et conformes à la
réglementation dans leurs applications.

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

## Démarrage

### Pre-requis

Vous devez d'abord installer [NodeJS](https://nodejs.org/en) en version 20 ou supérieure.

### Installation

```sh
  npm install @open3cl/engine
```

### Documentation

Lien à faire vers les wiki

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

## Utilisation

```javascript
import { calcul_3cl } from 'open3cl';

// Exemple d'objet JSON issu d'un fichier XML DPE
const dpeData = {
  numero_dpe: '2113E1018248X',
  statut: 'ACTIF',
  logement: {
    caracteristique_generale: {
      annee_construction: 1948,
      surface_habitable_logement: 49.96
    },
    installation_chauffage_collection: {
      installation_chauffage: [
        {
          description: 'Chaudière individuelle gaz standard',
          surface_chauffee: 49.96,
          generateur_chauffage_collection: {
            generateur_chauffage: [{ description: '...' }]
          }
        }
      ]
    }
  }
};

const result = calcul_3cl(dpeData);
```

## Variables d'environnements

| Nom                     | Description                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| ADEME_API_CLIENT_ID     | Client id pour l'api de l'ademe                                                                                         |
| ADEME_API_CLIENT_SECRET | Client secret pour l'api de l'ademe                                                                                     |
| DPE_FOLDER_PATH         | Chemin vers lequel sont stockés les fichiers DPE (si non précisé, utiliser `dpes-folder-path` dans la ligne de commande |

Attention aux quotas sur l'api:

- 100 requêtes / seconde
- 1000 requêtes / minute
- 10000 requêtes / jour

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

## Lancement des tests sur des corpus de DPE

Les tests de corpus consistent à analyser une liste de numéro de DPE présent dans un fichier CSV.
Pour chaque DPE, le fichier est téléchargé si pas déjà présent en local, et il est envoyé à la librairie Open3CL.
On analyse en sortie de la lib certaines valeurs que l'on compare aux valeurs du DPE initial. Le seuil de tolérance est
fixé par défaut à 5%.
La liste des valeurs analysées est la suivante:

```javascript
deperdition_mur,
  deperdition_baie_vitree,
  deperdition_plancher_bas,
  deperdition_plancher_haut,
  deperdition_porte,
  deperdition_renouvellement_air,
  hperm,
  deperdition_pont_thermique,
  surface_sud_equivalente,
  besoin_ecs,
  besoin_ch,
  conso_auxiliaire_distribution_ecs,
  conso_auxiliaire_generation_ch,
  conso_auxiliaire_generation_ecs,
  conso_ecs,
  conso_ch,
  conso_auxiliaire_distribution_ch,
  conso_auxiliaire_ventilation,
  ep_conso_5_usages,
  ep_conso_5_usages_m2,
  emission_ges_5_usages,
  emission_ges_5_usages_m2;
```

- `npm run test:corpus`. Va générer 2 rapports de sortie au format csv (détaillé) et json (global)
- `npm run test:corpus -- corpus-file-path=corpus.csv`. Chemin relatif vers le fichier de corpus à analyser
  Par défaut, le corpus utilisé est présent ici : [test/corpus/corpus_dpe.csv](test/corpus/corpus_dpe.csv)
- `npm run test:corpus -- dpes-folder-path=/home/user/dpes`. Chemin vers le dossier où les DPE seront téléchargés. Si un
  fichier DPE est déjà présent dans ce dossier, il ne sera pas retéléchargé.

### Résultats corpus

Résultats des tests de corpus avec le mode de compatibilité activé.

| Version librairie  | corpus                                 | Taux d'erreur  | Nb de DPES analysés   | Nb en dessous du taux d'erreur   | Taux de réussite   | Détail des valeurs                                                                                                    |
| :----------------- | :------------------------------------- | :------------- | --------------------- | -------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1.2.3              | corpus_dpe.csv                         | 5%             | 9980                  | 4489                             | 45%                |                                                                                                                       |
| 1.2.3              | dpe_immeuble_chauffage_individuel.csv  | 5%             | 9998                  | 3257                             | 32%                |                                                                                                                       |
| 1.2.3              | dpe_immeuble_chauffage_collectif.csv   | 5%             | 10000                 | 5279                             | 53%                |                                                                                                                       |
| 1.2.3              | dpe_immeuble_chauffage_mixte.csv       | 5%             | 10000                 | 2728                             | 27%                |                                                                                                                       |
| ------------------ | -------------------------------------- | -------------- | --------------------- | -------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1.2.8              | corpus_dpe.csv                         | 5%             | 9980                  | 4489                             | 45%                |                                                                                                                       |
| 1.2.8              | dpe_immeuble_chauffage_individuel.csv  | 5%             | 9998                  | 5275 (+2018)                     | 53% (+21%)         |                                                                                                                       |
| 1.2.8              | dpe_immeuble_chauffage_collectif.csv   | 5%             | 10000                 | 5747 (+468)                      | 57% (+4%)          |                                                                                                                       |
| 1.2.8              | dpe_immeuble_chauffage_mixte.csv       | 5%             | 10000                 | 3142 (+414)                      | 31% (+4%)          |                                                                                                                       |
| ------------------ | -------------------------------------- | -------------- | --------------------- | -------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1.3.1              | corpus_dpe.csv                         | 5%             | 9980                  | 4508 (+19)                       | 45%                |                                                                                                                       |
| 1.3.1              | dpe_immeuble_chauffage_individuel.csv  | 5%             | 9998                  | 5459 (+184)                      | 55% (+2%)          |                                                                                                                       |
| 1.3.1              | dpe_immeuble_chauffage_collectif.csv   | 5%             | 10000                 | 5848 (+101)                      | 58% (+1%)          |                                                                                                                       |
| 1.3.1              | dpe_immeuble_chauffage_mixte.csv       | 5%             | 10000                 | 4018 (+876)                      | 40% (+9%)          |                                                                                                                       |
| ------------------ | -------------------------------------- | -------------- | --------------------- | -------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 1.3.2              | corpus_dpe.csv                         | 5%             | 9980                  | 4519 (+11)                       | 45%                | [Voir le détail](https://open3cl.github.io/engine/reports/corpus?corpus_file=corpus_dpe.csv)                          |
| 1.3.2              | dpe_immeuble_chauffage_individuel.csv  | 5%             | 9998                  | 5476 (+17)                       | 55%                | [Voir le détail](https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_immeuble_chauffage_individuel.csv)   |
| 1.3.2              | dpe_immeuble_chauffage_collectif.csv   | 5%             | 10000                 | 5869 (+21)                       | 58%                | [Voir le détail](https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_immeuble_chauffage_collectif.csv)    |
| 1.3.2              | dpe_immeuble_chauffage_mixte.csv       | 5%             | 10000                 | 4040 (+22)                       | 40%                | [Voir le détail](https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_immeuble_chauffage_mixte.csv)        |

## Roadmap

- [x] Site Open 3CL
- [ ] Refacto technique
- [ ] Rapports de tests
- [ ] Certification ADEME
- [ ] Fonctionnalités
  - [ ] DPE à l'immeuble
  - [ ] Photovoltaïque

Voir la liste des [issues](https://github.com/Open3CL/engine/issues) pour avoir le détail complet des bugs et
fonctionnalités en cours de réalisation.

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

## Contribution

Nous accueillons les contributions avec plaisir ! Si vous souhaitez améliorer Open3CL, veuillez :

- Forker le dépôt.
- Créer une branche pour vos modifications.
- Soumettre une pull request avec une description claire des changements apportés.
- Consultez le fichier [CONTRIBUTING.md](CONTRIBUTING.md) pour plus de détails.

### Meilleurs contributeurs

<a href="https://github.com/Open3CL/engine/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Open3CL/engine" alt="contrib.rocks image" />
</a>

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

## Licence

Distribué sous la license `GPL-3.0 license`. Lire le fichier `LICENSE` pour plus d'informations.

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

## Contact

Pour plus d'informations merci de nous contacter à cette adresse : open3cl@redfroggy.fr

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

## Remerciements

A compléter

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

[contributors-shield]: https://img.shields.io/github/contributors/Open3CL/engine.svg?style=for-the-badge
[contributors-url]: https://github.com/Open3CL/engine/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/Open3CL/engine.svg?style=for-the-badge
[forks-url]: https://github.com/Open3CL/network/members
[stars-shield]: https://img.shields.io/github/stars/Open3CL/engine.svg?style=for-the-badge
[stars-url]: https://github.com/Open3CL/stargazers
[issues-shield]: https://img.shields.io/github/issues/Open3CL/engine.svg?style=for-the-badge
[issues-url]: https://github.com/Open3CL/issues
[license-shield]: https://img.shields.io/github/license/Open3CL/engine.svg?style=for-the-badge
[license-url]: https://github.com/Open3CL/blob/master/LICENSE
[product-screenshot]: images/screenshot.png
[Javascript]: https://img.shields.io/badge/javascript-000000?style=for-the-badge&logo=javascript&logoColor=white
