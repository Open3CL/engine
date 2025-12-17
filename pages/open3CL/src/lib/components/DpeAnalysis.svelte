<script>
  import { JSONEditor } from 'svelte-jsoneditor';
  import { Accordion, AccordionItem, Badge, Dropzone, Label, Spinner,Button } from 'flowbite-svelte';
  import { calcul_3cl } from '@open3cl/engine';
  import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '@open3cl/engine/utils.js';
  import enums from '@open3cl/engine/enums.js';
  import { DpeXmlParserService } from '$services/dpe-xml-parser.service.js';
  import JsonDiff from '$components/JsonDiff.svelte';
  import { getAnalyzedDpe, setAnalyzedDpe } from '$lib/runes/dpe-analyzed.svelte.js';

  set_tv_match_optimized_version();

  // Enable open3cl compatibility mode
  set_bug_for_bug_compat();

  let inputJsonEditor;
  let outputJsonEditor;

  let filesInDropzone = $state(null);

  let dpeInfos = $state([]);

  /**
   * Ademe xml data (json format) input of the 3CL engine
   * @type {Partial<JsonEditorContent>}
   */
  let inputDpeData = $state({text: ''});


  let inputDpe = $derived.by(() => {
    return inputDpeData.text !== '' ? JSON.parse(inputDpeData.text) : {};
  });

  /**
   * Ademe xml data (json format) output of the 3CL engine
   * @type {Partial<JsonEditorContent>}
   */
  let outputDpeData = $state({text: ''});

  let outputDpe = $derived.by(() => {
    return outputDpeData.text !== '' ? JSON.parse(outputDpeData.text) : {};
  });

  /**
   * @param event {ProgressEvent<FileReader>}
   */
  const handleXmlFile = (event) => {
    if (event.target && event.target.result) {
      inputDpeData = {text: JSON.stringify(DpeXmlParserService.convertFileToJson(event.target.result.toString()), null, 2)};
      refreshOutputJsonEditor(inputDpeData);
    }
  };

  const loadFile = () => {
    let reader = new FileReader();
    reader.onload = handleXmlFile;

    reader.readAsText(filesInDropzone[0]);
  };

  function handleOnChange(event) {
    const target = event.target;
    filesInDropzone = target.files;
    loadFile();
  }

  function handleOnDrop(event) {
    event.preventDefault();
    filesInDropzone = event.dataTransfer?.files ?? null;
    loadFile();
  }

  /**
   * @param updatedContent {JsonEditorContent}*
   */
  const refreshOutputJsonEditor = (updatedContent) => {
    const jsonContent = JSON.parse(updatedContent.text);
    setAnalyzedDpe(jsonContent);
    outputDpeData = {text: JSON.stringify(calcul_3cl(jsonContent), null, 2)};
    summarizeDpeInfos();
    beautifyJsonEditor(inputJsonEditor);
    beautifyJsonEditor(outputJsonEditor);
  };

  const beautifyJsonEditor = (jsonEditor) => {
    setTimeout(() => {
      jsonEditor.collapse([], true);
      setTimeout(() => {
        jsonEditor.expand(['administratif']);
      }, 100)

    }, 100);
  }

  /**
   * @param event {Event}
   */
  const clearAnalyzedDpe = (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    setAnalyzedDpe({numero_dpe: undefined});
    dpeInfos = [];
    filesInDropzone = null
  }

  const summarizeDpeInfos = () => {
    const dpe = getAnalyzedDpe();
    /** @type {string} **/
    const methodeApplication = enums['methode_application_dpe_log'][dpe.logement.caracteristique_generale.enum_methode_application_dpe_log_id];
    const chauffageDpeInfos = [];
    const ecsDpeInfos = [];
    const ventilationDpeInfos = [];
    const generalInfos = [];
    const logementInfos = [];
    const meteoInfos = [];
    generalInfos.push({label: toDpeInfoLabel('Version dpe', dpe.administratif.enum_version_id), color: 'teal'});

    if (methodeApplication.includes('immeuble')) {
      generalInfos.push({label: 'Dpe immeuble', color: 'teal'});
    }

    if (methodeApplication.includes('individuel')) {
      if (methodeApplication.includes('maison')) {
        generalInfos.push({label: 'Maison individuelle', color: 'teal'});
      }
      if (methodeApplication.includes('appartement')) {
        generalInfos.push({label: 'Appartement individuel', color: 'teal'});
      }
    }

    if (dpe.logement.caracteristique_generale.annee_construction) {
      logementInfos.push({label: toDpeInfoLabel('Année de construction', dpe.logement.caracteristique_generale.annee_construction ), color: 'amber'});
    }

    logementInfos.push({label: toDpeInfoLabel('Période de construction', enums['periode_construction'][dpe.logement.caracteristique_generale.enum_periode_construction_id]), color: 'amber'});
    if (dpe.logement.caracteristique_generale.surface_habitable_logement) {
      logementInfos.push({label: toDpeInfoLabel('Surface logement', dpe.logement.caracteristique_generale.surface_habitable_logement, 'm²'), color: 'amber'});
    }
    if (dpe.logement.caracteristique_generale.surface_habitable_immeuble) {
      logementInfos.push({label: toDpeInfoLabel('Surface immeuble', dpe.logement.caracteristique_generale.surface_habitable_immeuble, 'm²'), color: 'amber'});
    }
    if (dpe.logement.caracteristique_generale.nombre_appartement) {
      logementInfos.push({label: toDpeInfoLabel('Nombre d\'appartements', dpe.logement.caracteristique_generale.nombre_appartement), color: 'amber'});
    }
    logementInfos.push({label: toDpeInfoLabel('Hauteur ss plafond', dpe.logement.caracteristique_generale.hsp, 'm'), color: 'amber'});

    meteoInfos.push({label: toDpeInfoLabel('Zone climatique', enums['zone_climatique'][dpe.logement.meteo.enum_zone_climatique_id]), color: 'emerald'});
    meteoInfos.push({label: toDpeInfoLabel('Altitude', enums['classe_altitude'][dpe.logement.meteo.enum_classe_altitude_id]), color: 'emerald'});

    if (methodeApplication.includes('chauffage')) {
      if (methodeApplication.includes('chauffage mixte')) {
        chauffageDpeInfos.push({label: 'Chauffage mixte', color: 'indigo'});
      }
      if (methodeApplication.includes('chauffage collectif')) {
        chauffageDpeInfos.push({label: 'Chauffage collectif', color: 'indigo'});
      }
      if (methodeApplication.includes('chauffage individuel')) {
        chauffageDpeInfos.push({label: 'Chauffage individuel', color: 'indigo'});
      }
    }
    chauffageDpeInfos.push({label: `${dpe.logement.installation_chauffage_collection?.installation_chauffage?.length || 0} installation(s) chauffage`, color: 'indigo'});
    const chauffagesGenDescriptions = dpe.logement
      .installation_chauffage_collection?.installation_chauffage?.flatMap(inst => inst.generateur_chauffage_collection
        .generateur_chauffage.map(gen => `générateur: ${enums['type_generateur_ch'][gen.donnee_entree.enum_type_generateur_ch_id]} (id: ${gen.donnee_entree.enum_type_generateur_ch_id})`));

    const chauffagesEmetteurDescriptions = dpe.logement
      .installation_chauffage_collection?.installation_chauffage?.flatMap(inst => inst.emetteur_chauffage_collection
        .emetteur_chauffage.map(emetteur => `émetteur: ${enums['equipement_intermittence'][emetteur.donnee_entree.enum_equipement_intermittence_id]} (id: ${emetteur.donnee_entree.enum_equipement_intermittence_id})`));

    chauffagesGenDescriptions.forEach(chauffagesGenDescription => {
      chauffageDpeInfos.push({label: chauffagesGenDescription, color: 'indigo'});
    });

    chauffagesEmetteurDescriptions.forEach(chauffagesEmetteurDescription => {
      chauffageDpeInfos.push({label: chauffagesEmetteurDescription, color: 'indigo'});
    });

    if (methodeApplication.includes('ecs')) {
      if (methodeApplication.includes('ecs mixte')) {
        ecsDpeInfos.push({label: 'Ecs mixte', color: 'fuchsia'});
      }
      if (methodeApplication.includes('ecs collectif')) {
        ecsDpeInfos.push({label: 'Ecs collectif', color: 'fuchsia'});
      }
      if (methodeApplication.includes('ecs individuel')) {
        ecsDpeInfos.push({label: 'Ecs individuel', color: 'fuchsia'});
      }
    }
    ecsDpeInfos.push({label: `${dpe.logement.installation_ecs_collection?.installation_ecs.length || 0} installation(s) ecs`, color: 'fuchsia'});

    const ecsGenDescriptions = dpe.logement
      .installation_ecs_collection?.installation_ecs?.flatMap(inst => inst.generateur_ecs_collection
        .generateur_ecs.map(gen => `générateur: ${enums['type_generateur_ecs'][gen.donnee_entree.enum_type_generateur_ecs_id]} (id: ${gen.donnee_entree.enum_type_generateur_ecs_id})`));

    ecsGenDescriptions.forEach(ecsGenDescription => {
      ecsDpeInfos.push({label: ecsGenDescription, color: 'fuchsia'});
    });

    ventilationDpeInfos.push({label: `${dpe.logement.ventilation_collection?.ventilation.length || 0} installation(s) ventilation`, color: 'sky'});

    const ventilationDescriptions = dpe.logement
      .ventilation_collection?.ventilation?.map(ventilation => `${enums['type_ventilation'][ventilation.donnee_entree.enum_type_ventilation_id]} (id: ${ventilation.donnee_entree.enum_type_ventilation_id})`);
    ventilationDescriptions.forEach(ventilationDescription => {
      ventilationDpeInfos.push({label: ventilationDescription, color: 'sky'});
    });

    dpeInfos.push(generalInfos);
    dpeInfos.push(logementInfos);
    dpeInfos.push(meteoInfos);
    dpeInfos.push(chauffageDpeInfos);
    dpeInfos.push(ecsDpeInfos);
    dpeInfos.push(ventilationDpeInfos);
  }

  /**
   * @param label {string}
   * @param value {any}
   * @param suffix {string?}
   */
  function toDpeInfoLabel(label, value, suffix = '') {
    return `${label} :&nbsp;<span class="font-bold underline">${value} ${suffix}</span>`;
  }

</script>

<Accordion multiple>
    <AccordionItem open>
        {#snippet header()}
            <div class="flex justify-center gap-5 items-center">
                {#if getAnalyzedDpe().numero_dpe}
                    <div>Données dpe <Badge large color="green">{getAnalyzedDpe().numero_dpe}</Badge></div>
                    <Button size="xs" onclick={clearAnalyzedDpe}>Analyser un autre DPE</Button>
                {:else}
                    Données dpe
                {/if}
            </div>
        {/snippet}
        <div>
            {#if (filesInDropzone && filesInDropzone[0]) && !getAnalyzedDpe().numero_dpe}
                <div class="pb-3">
                    <Spinner type="orbit" color="rose" size="{6}" />
                    <span class="text-sm">Analyse du dpe en cours...</span>
                </div>
            {/if}
            {#if !(filesInDropzone && filesInDropzone[0])}
                <Dropzone id="my-awesome-dropzone" bind:files={filesInDropzone} onChange={handleOnChange} onDrop={handleOnDrop} accept=".xml">
                    <svg aria-hidden="true" class="mb-3 h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span class="font-semibold">Cliquer pour charger un dpe à analyser</span>
                        ou glisser / déposer.
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Format XML uniquement</p>
                </Dropzone>
            {:else}
                <div class="flex gap-3 justify-start">
                    {#each dpeInfos as info}
                        <div>
                            {#each info as dpeInfo}
                                <div class="pt-1">
                                    <Badge large color="{dpeInfo.color}">{@html dpeInfo.label}</Badge>
                                </div>
                            {/each}
                        </div>
                    {/each}
                </div>

            {/if}
        </div>
        <div class="grid gap-2 p-3 md:grid-cols-2">
            <div>
                <Label class="pb-1"
                >Données d'entrée
                    <Badge color="pink">Entrée</Badge>
                </Label>
                <JSONEditor bind:this={inputJsonEditor} collapse="{true}" mode="text" mainMenuBar="{false}" navigationBar="{false}" content={inputDpeData} onChange={refreshOutputJsonEditor} />
            </div>
            <div>
                <div class="flex justify-between">
                    <Label class="pb-1"
                    >Données de sortie du moteur Open 3CL
                        <Badge color="green">Sortie</Badge>
                    </Label>
                </div>
                <JSONEditor bind:this={outputJsonEditor} collapse="{true}" mode="text" mainMenuBar="{false}" navigationBar="{false}" content={outputDpeData} />
            </div>
        </div>
    </AccordionItem>
    <AccordionItem open>
        {#snippet header()}
            <div>Différences entrée / sortie dpe <Badge large color="green">{inputDpe?.numero_dpe}</Badge></div>
        {/snippet}
        <div>
           <JsonDiff input={inputDpe} output={outputDpe}></JsonDiff>
        </div>
    </AccordionItem>
</Accordion>



