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

| Nom                     | Description                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| DPE_FOLDER_PATH         | **Obligatoire**: Chemin vers lequel sont stockés les fichiers DPE (si non précisé, utiliser `dpes-folder-path` dans la ligne de commande |
| ADEME_API_CLIENT_ID     | Client id pour l'api de l'ademe                                                                                                          |
| ADEME_API_CLIENT_SECRET | Client secret pour l'api de l'ademe                                                                                                      |
| MAX_WORKER_THREADS      | Nombre de threads maximum pour les tests de corpus, par défaut: os.availableParallelism \* 1.5                                           |
| WORKER_THREADS_CHUNKS   | Nombre de dpe à analyser par thread, par défaut: 200                                                                                     |
| API_ADEME_DOWNLOAD_WAIT | Temps d'attente en ms entre chaque dpe à télécharger via l'api de l'ademe, par défaut: 1s                                                |

Attention aux quotas sur l'api:

- 100 requêtes / seconde
- 1000 requêtes / minute
- 10000 requêtes / jour

Dans le cas où un corpus est joué avec beaucoup de dpe à télécharger via l'api de l'ademe (car non présent en local), la
meilleure configuration est:

- `export MAX_WORKER_THREADS=10`
- `export API_ADEME_DOWNLOAD_WAIT=1000`
- `export WORKER_THREADS_CHUNKS=300`

<p align="right">(<a href="#readme-top">Retour sommaire</a>)</p>

## Corpus

### Introduction

Les tests de corpus consistent à analyser une liste de numéro de DPE présent dans un fichier CSV.

- Pour chaque DPE, le fichier est téléchargé si pas déjà présent en local, et il est envoyé à la librairie Open3CL.
- On analyse en sortie de la lib certaines valeurs que l'on compare aux valeurs du DPE initial.
- **Le seuil de tolérance est fixé par défaut à 5%**.

### Qu'est-ce qui est contrôlé ?

Les informations contrôlées et qui doivent obligatoirement ne pas dépasser
le seuil des **5%** entre le dpe d'origine et le dpe proposé par la librairie Open3CL sont :

- logement.sortie.ef_conso.conso_ecs
- logement.sortie.ef_conso.conso_ch
- logement.sortie.ep_conso.ep_conso_5_usages ou logement.sortie.ep_conso.ep_conso_5_usages_m2
- logement.sortie.emission_ges.emission_ges_5_usages ou logement.sortie.emission_ges.emission_ges_5_usages_m2

### Liste des corpus

Il existe actuellement 8 corpus (avec 10000 dpe analysés dans chaque corpus) :

- `corpus.csv`: Corpus généraliste
- `dpe_logement_individuel_2025.csv`: Corpus avec uniquement des dpe individuels réalisés en 2025
- `dpe_maison_individuelle_2025.csv`: Corpus avec uniquement des dpe maison individuelle réalisés en 2025
- `dpe_appartement_individuel_chauffage_individuel_2025.csv`: Corpus avec uniquement des dpe appartement avec chauffage
  individuel réalisés en 2025
- `dpe_appartement_individuel_chauffage_collectif_2025.csv`: Corpus avec uniquement des dpe appartement avec chauffage
  collectif réalisés en 2025
- `dpe_immeuble_chauffage_individuel.csv`: Corpus avec uniquement des dpe immeuble pour des logements avec chauffage
  individuel
- `dpe_immeuble_chauffage_collectif.csv`: Corpus avec uniquement des dpe immeuble pour des logements avec chauffage
  collectif
- `dpe_immeuble_chauffage_mixte.csv`: Corpus avec uniquement des dpe immeuble pour des logements avec chauffage mixte

### Comment lancer les corpus ?

- `npm run test:corpus:all`: Joue l'intégralité des corpus et génère les rapports associés.
- `npm run test:corpus`. Joue le corpus [corpus_dpe.csv](test/corpus/files/corpus_dpe.csv) et génère les rapports
  associés.
- `npm run test:corpus -- corpus-file-path=corpus.csv`. Chemin relatif vers le fichier de corpus à analyser
  Par défaut, le corpus utilisé est présent ici : [test/corpus/corpus_dpe.csv](test/corpus/files/corpus_dpe.csv)
- `npm run test:corpus -- dpes-folder-path=/home/user/dpes`. Chemin vers le dossier ou les DPE seront téléchargés. Si un
  fichier DPE est déjà présent dans ce dossier, il ne sera pas retéléchargé.

### Résultats corpus

Résultats des tests de corpus avec le mode de compatibilité activé.

<details>
<summary>Voir les versions précédents</summary>

| Version librairie    | corpus                                | Nb en dessous du taux d'erreur | Taux de réussite        | Description                                       | Détail des valeurs |
| :------------------- | ------------------------------------- | ------------------------------ | ----------------------- | ------------------------------------------------- | ------------------ |
| <ins>**1.2.3**<ins>  | <ins>**corpus_dpe.csv**<ins>          | <ins>**4489**<ins>             | <ins>**45%**<ins>       |                                                   |                    |
| 1.2.3                | dpe_immeuble_chauffage_individuel.csv | 3257                           | 32%                     |                                                   |                    |
| 1.2.3                | dpe_immeuble_chauffage_collectif.csv  | 5279                           | 53%                     |                                                   |                    |
| 1.2.3                | dpe_immeuble_chauffage_mixte.csv      | 2728                           | 27%                     |                                                   |                    |
| <ins>**1.2.8**<ins>  | <ins>**corpus_dpe.csv**<ins>          | <ins>**489**<ins>              | <ins>**45%**<ins>       |                                                   |                    |
| 1.2.8                | dpe_immeuble_chauffage_individuel.csv | 5275 (+2018)                   | 53% (+21%)              |                                                   |                    |
| 1.2.8                | dpe_immeuble_chauffage_collectif.csv  | 5747 (+468)                    | 57% (+4%)               |                                                   |                    |
| 1.2.8                | dpe_immeuble_chauffage_mixte.csv      | 3142 (+414)                    | 31% (+4%)               |                                                   |                    |
| <ins>**1.3.1**<ins>  | <ins>**corpus_dpe.csv**<ins>          | <ins>**4508 (+19)**<ins>       | <ins>**45%**<ins>       |                                                   |                    |
| 1.3.1                | dpe_immeuble_chauffage_individuel.csv | 5459 (+184)                    | 55% (+2%)               |                                                   |                    |
| 1.3.1                | dpe_immeuble_chauffage_collectif.csv  | 5848 (+101)                    | 58% (+1%)               |                                                   |                    |
| 1.3.1                | dpe_immeuble_chauffage_mixte.csv      | 4018 (+876)                    | 40% (+9%)               |                                                   |                    |
| <ins>**1.3.2**<ins>  | <ins>**corpus_dpe.csv**<ins>          | <ins>**4519 (+11)**<ins>       | <ins>**45%**<ins>       |                                                   |                    |
| 1.3.2                | dpe_immeuble_chauffage_individuel.csv | 5476 (+17)                     | 55%                     |                                                   |                    |
| 1.3.2                | dpe_immeuble_chauffage_collectif.csv  | 5869 (+21)                     | 58%                     |                                                   |                    |
| 1.3.2                | dpe_immeuble_chauffage_mixte.csv      | 4040 (+22)                     | 40%                     |                                                   |                    |
| <ins>**1.3.5**<ins>  | <ins>**corpus_dpe.csv**<ins>          | <ins>**4522 (+3)**<ins>        | <ins>**45%**<ins>       |                                                   |                    |
| 1.3.5                | dpe_immeuble_chauffage_individuel.csv | 5488 (+12)                     | 55%                     |                                                   |
| 1.3.5                | dpe_immeuble_chauffage_collectif.csv  | 5869                           | 58%                     |                                                   |                    |
| 1.3.5                | dpe_immeuble_chauffage_mixte.csv      | 4082 (+42)                     | 40%                     |                                                   |                    |
| <ins>**1.3.6**<ins>  | <ins>**corpus_dpe.csv**<ins>          | <ins>**4522**<ins>             | <ins>**45%**<ins>       |                                                   |                    |
| 1.3.6                | dpe_immeuble_chauffage_individuel.csv | 5650 (+162)                    | 56%                     |                                                   |                    |
| 1.3.6                | dpe_immeuble_chauffage_collectif.csv  | 5894 (+25)                     | 59% (+1%)               |                                                   |                    |
| 1.3.6                | dpe_immeuble_chauffage_mixte.csv      | 4141 (+59)                     | 41% (+1%)               |                                                   |                    |
| <ins>**1.3.7**<ins>  | <ins>**corpus_dpe.csv**<ins>          | <ins>**4522**<ins>             | <ins>**45%**<ins>       |                                                   |                    |
| 1.3.7                | dpe_immeuble_chauffage_individuel.csv | 6960 (+1310)                   | 69% (+13%)              |                                                   |                    |
| 1.3.7                | dpe_immeuble_chauffage_collectif.csv  | 6106 (+212)                    | 61% (+2%)               |                                                   |                    |
| 1.3.7                | dpe_immeuble_chauffage_mixte.csv      | 4730 (+589)                    | 47% (+6%)               |                                                   |                    |
| <ins>**1.3.8**<ins>  | <ins>**corpus_dpe.csv**<ins>          | <ins>**4522**<ins>             | <ins>**45%**<ins>       |                                                   |                    |
| 1.3.8                | dpe_immeuble_chauffage_individuel.csv | 6965 (+5)                      | 69%                     |                                                   |                    |
| 1.3.8                | dpe_immeuble_chauffage_collectif.csv  | 6110 (+4)                      | 61%                     |                                                   |                    |
| 1.3.8                | dpe_immeuble_chauffage_mixte.csv      | 4735 (+5)                      | 47%                     |                                                   |                    |
| <ins>**1.3.9**<ins>  | <ins>**corpus_dpe.csv**<ins>          | <ins>**4460**<ins> (-62)       | <ins>**44% (-1%)**<ins> | Pertes liés au fix bug tribu zone 2hd valeur dh19 |                    |
| 1.3.9                | dpe_immeuble_chauffage_individuel.csv | 6901 (-64)                     | 69%                     | Pertes liés au fix bug tribu zone 2hd valeur dh19 |                    |
| 1.3.9                | dpe_immeuble_chauffage_collectif.csv  | 6058 (-58)                     | 60% (-1%)               | Pertes liés au fix bug tribu zone 2hd valeur dh19 |                    |
| 1.3.9                | dpe_immeuble_chauffage_mixte.csv      | 4728 (-7)                      | 47%                     | Pertes liés au fix bug tribu zone 2hd valeur dh19 |                    |
| <ins>**1.3.11**<ins> | <ins>**corpus_dpe.csv**<ins>          | <ins>**4468**<ins> (+8)        | <ins>**44%**<ins>       |                                                   |                    |
| 1.3.11               | dpe_immeuble_chauffage_individuel.csv | 6901                           | 69%                     |                                                   |                    |
| 1.3.11               | dpe_immeuble_chauffage_collectif.csv  | 6058                           | 60%                     |                                                   |                    |
| 1.3.11               | dpe_immeuble_chauffage_mixte.csv      | 4727 (-1)                      | 47%                     | Dpes erronés sur le calcul volume ballon ecs      |                    |
| <ins>**1.3.12**<ins> | <ins>**corpus_dpe.csv**<ins>          | <ins>**4467**<ins> (-1)        | <ins>**44%**<ins>       | Dpe erroné avec surface chauffée invalide         |                    |
| 1.3.12               | dpe_logement_individuel_2025.csv      | 8429                           | 84%                     |                                                   |                    |
| 1.3.12               | dpe_immeuble_chauffage_individuel.csv | 6900 (-1)                      | 69%                     | Dpe erroné avec surface chauffée invalide         |                    |
| 1.3.12               | dpe_immeuble_chauffage_collectif.csv  | 6058                           | 60%                     |                                                   |                    |
| 1.3.12               | dpe_immeuble_chauffage_mixte.csv      | 4725 (-2)                      | 47%                     | Dpe erroné avec surface chauffée invalide         |                    |
| <ins>**1.3.15**<ins> | <ins>**corpus_dpe.csv**<ins>          | <ins>**4481**<ins> (+14)       | <ins>**45 (+1%)**<ins>  |                                                   |                    |
| 1.3.15               | dpe_logement_individuel_2025.csv      | 8453                           | 84%                     |                                                   |                    |
| 1.3.15               | dpe_immeuble_chauffage_individuel.csv | 7106 (+205)                    | 71% (+2%)               |                                                   |                    |
| 1.3.15               | dpe_immeuble_chauffage_collectif.csv  | 6083 (+25)                     | 61% (+1%)               |                                                   |                    |
| 1.3.15               | dpe_immeuble_chauffage_mixte.csv      | 4751 (+24)                     | 47%                     |                                                   |                    |

</details>

| Version librairie    | corpus                                                   | Nb en dessous du taux d'erreur | Taux de réussite  | Description | Détail des valeurs                                                                                                                                                |
| :------------------- | -------------------------------------------------------- | ------------------------------ | ----------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <ins>**1.3.20**<ins> | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4500**<ins> (+19)       | <ins>**45%**<ins> |             |                                                                                                                                                                   |
| 1.3.20               | dpe_logement_individuel_2025.csv                         | 8459 (+6)                      | 84%               |             |                                                                                                                                                                   |
| 1.3.20               | dpe_maison_individuelle_2025.csv                         | 8638                           | 86%               |             |                                                                                                                                                                   |
| 1.3.20               | dpe_appartement_individuel_chauffage_individuel_2025.csv | 8561                           | 86%               |             |                                                                                                                                                                   |
| 1.3.20               | dpe_immeuble_chauffage_individuel.csv                    | 7106                           | 71%               |             |                                                                                                                                                                   |
| 1.3.20               | dpe_immeuble_chauffage_collectif.csv                     | 6083                           | 61%               |             |                                                                                                                                                                   |
| 1.3.20               | dpe_immeuble_chauffage_mixte.csv                         | 4751                           | 47%               |             |                                                                                                                                                                   |
| <ins>**1.3.21**<ins> | <ins>**corpus_dpe.csv**<ins>                             | <ins>**4502**<ins> (+2)        | <ins>**45%**<ins> |             | <a href="https://open3cl.github.io/engine/reports/corpus?corpus_file=corpus_dpe.csv" target="_blank">Voir le détail</a>                                           |
| 1.3.21               | dpe_logement_individuel_2025.csv                         | 8504 (+45)                     | 85% (+1%)         |             | <a href="https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_logement_individuel_2025.csv" target="_blank">Voir le détail</a>                         |
| 1.3.21               | dpe_maison_individuelle_2025.csv                         | 8652 (+14)                     | 86%               |             | <a href="https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_maison_individuelle_2025.csv" target="_blank">Voir le détail</a>                         |
| 1.3.21               | dpe_appartement_individuel_chauffage_individuel_2025.csv | 8578 (+17)                     | 86%               |             | <a href="https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_appartement_individuel_chauffage_individuel_2025.csv" target="_blank">Voir le détail</a> |
| 1.3.21               | dpe_appartement_individuel_chauffage_collectif_2025.csv  | 6681                           | 67%               |             | <a href="https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_appartement_individuel_chauffage_collectif_2025.csv" target="_blank">Voir le détail</a>  |
| 1.3.21               | dpe_immeuble_chauffage_individuel.csv                    | 7144 (+38)                     | 71%               |             | <a href="https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_immeuble_chauffage_individuel.csv" target="_blank">Voir le détail</a>                    |
| 1.3.21               | dpe_immeuble_chauffage_collectif.csv                     | 6144 (+61)                     | 61%               |             | <a href="https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_immeuble_chauffage_collectif.csv" target="_blank">Voir le détail</a>                     |
| 1.3.21               | dpe_immeuble_chauffage_mixte.csv                         | 4760 (+9)                      | 47%               |             | <a href="https://open3cl.github.io/engine/reports/corpus?corpus_file=dpe_immeuble_chauffage_mixte.csv" target="_blank">Voir le détail</a>                         |

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
