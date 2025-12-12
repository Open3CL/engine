<script>
  import { JSONEditor } from 'svelte-jsoneditor';
  import { Accordion, AccordionItem, Badge, Dropzone, Label, Spinner,Button } from 'flowbite-svelte';
  import { calcul_3cl } from '@open3cl/engine';
  import { set_bug_for_bug_compat, set_tv_match_optimized_version } from '@open3cl/engine/utils.js';
  import { DpeXmlParserService } from '$services/dpe-xml-parser.service.js';
  import JsonDiff from '$components/JsonDiff.svelte';
  import { setAnalyzedDpe } from '$lib/runes/dpe-analyzed.svelte.js';

  set_tv_match_optimized_version();

  // Enable open3cl compatibility mode
  set_bug_for_bug_compat();

  let inputJsonEditor;
  let outputJsonEditor;

  let filesInDropzone = $state(null);

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
    setAnalyzedDpe({code: jsonContent.numero_dpe});
    outputDpeData = {text: JSON.stringify(calcul_3cl(jsonContent), null, 2)};
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
    filesInDropzone = null
  }

</script>

<Accordion multiple>
    <AccordionItem open>
        {#snippet header()}
            <div class="flex justify-center gap-5 items-center">
                {#if inputDpe?.numero_dpe}
                    <div>Données dpe <Badge large color="green">{inputDpe?.numero_dpe}</Badge></div>
                    <Button size="xs" onclick={clearAnalyzedDpe}>Analyser un autre DPE</Button>
                {:else}
                    Données dpe
                {/if}
            </div>
        {/snippet}
        <div>
            {#if (filesInDropzone && filesInDropzone[0]) && !inputDpe?.numero_dpe}
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
            {/if}
        </div>
        <div class="grid gap-2 p-3 md:grid-cols-2">
            <div>
                <Label
                >Données d'entrée
                    <Badge color="pink">Entrée</Badge>
                </Label>
                <JSONEditor bind:this={inputJsonEditor} collapse="{true}" mode="text" mainMenuBar="{false}" navigationBar="{false}" content={inputDpeData} onChange={refreshOutputJsonEditor} />
            </div>
            <div>
                <div class="flex justify-between">
                    <Label
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



