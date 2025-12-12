<script>
  import { Badge, Sidebar, SidebarGroup, SidebarItem } from 'flowbite-svelte';
  import { getAnalyzedDpe } from '$lib/runes/dpe-analyzed.svelte.js';
  import DpeAnalysis from '$components/DpeAnalysis.svelte';
  import { PUBLIC_REPORTS_URL } from '$env/static/public';
  let menuSelected = 'analysis';

  function selectMenu(selected){
    menuSelected = selected;
  }
</script>

<div class="relative">
    <Sidebar
            alwaysOpen
            backdrop={false}
            params={{ x: -50, duration: 50 }}
            class="z-50 h-full"
            position="absolute"
            classes={{ nonactive: "p-2", active: "p-2" }}
    >
        <SidebarGroup>
            <SidebarItem active="{menuSelected === 'analysis'}" onclick="{() => selectMenu('analysis')}" label="{getAnalyzedDpe().numero_dpe ? 'Dpe analysé'  : 'Analyser un Dpe'}">
                {#snippet subtext()}
                    {#if getAnalyzedDpe().numero_dpe}
                        <Badge color="green" class="p-1 ml-2">{getAnalyzedDpe().numero_dpe}</Badge>
                    {/if}
                {/snippet}
            </SidebarItem>
            <SidebarItem active="{menuSelected === 'reports'}" onclick="{() => selectMenu('reports')}" label="Rapports corpus" />
        </SidebarGroup>
    </Sidebar>
</div>
<div class="h-full overflow-auto px-4 md:ml-64 w-full">
    <div class="{menuSelected !== 'analysis' ? 'hidden': ''}">
        <DpeAnalysis />
    </div>
    {#if menuSelected === 'reports'}
        <div class="{menuSelected !== 'reports' ? 'hidden w-full': 'w-full'}"><iframe class="w-full h-250"  src="{PUBLIC_REPORTS_URL}"></iframe></div>
    {/if}
</div>
