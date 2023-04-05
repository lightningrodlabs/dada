<script lang="ts">
    import Toolbar from './Toolbar.svelte'
    import ConvoPane from './ConvoPane.svelte'
    import { DadaStore } from './dadaStore'
    import { setContext } from 'svelte';
    import type { AppAgentClient } from '@holochain/client';
    import type { SynStore } from '@holochain-syn/store';
    import { MaterialApp, Icon } from 'svelte-materialify';
    import { mdiArchiveArrowUp, mdiCog, mdiShapeSquarePlus } from '@mdi/js';
    import { fade } from 'svelte/transition';

    export let roleName = ""

    let synStore: SynStore;
    let tsStore: DadaStore;
    
    export let client : AppAgentClient

    $: activeConvoIndex = tsStore ? tsStore.convoList.activeConvoHash : undefined
    $: convoList = tsStore ? tsStore.convoList.stateStore() : undefined
    $: archivedConvos = convoList ? $convoList.convos.filter((convo)=>convo.status === "archived") : []
    $: activeConvos = convoList ? $convoList.convos.filter((convo)=>convo.status !== "archived") : []

    initialize()

    setContext('synStore', {
      getStore: () => synStore,
    });
  
    setContext('tsStore', {
      getStore: () => tsStore,
    });

    async function initialize() : Promise<void> {
      const store = createStore()
      synStore = store.synStore;
      try {
        await store.loadConvos()
        tsStore = store
      } catch (e) {
        console.log("Error loading convos:", e)
      }
    }
    function createStore() : DadaStore {
      const store = new DadaStore(
        client,
        roleName
      );
      return store
    }

  </script>
   
  <svelte:head>
    <script src='https://kit.fontawesome.com/80d72fa568.js' crossorigin='anonymous'></script>
  </svelte:head>
<MaterialApp>
  <div class='app'>
    {#if tsStore}
      <Toolbar />
      <div class="transition-container">
      {#if convoList && $convoList.convos.length == 0}
        <div class="welcome-text" transition:fade>
          <p></p>
          <p>
            Click on the <Icon style="width:20px; color:black; vertical-align: bottom;" path={mdiShapeSquarePlus}></Icon> above to create your first convo.
          </p>
        </div>
      {/if}
      {#if convoList && $convoList.convos.length > 0 && $activeConvoIndex === undefined}
        <div class="welcome-text" transition:fade>
          <p>Active Convos: {activeConvos.length}, Archived Convos: {archivedConvos.length}</p>
            <p>
              Select a convo from the dropdown above, or add a new one with the  <Icon style="width:20px; color:black; vertical-align: bottom;" path={mdiShapeSquarePlus}></Icon> button.
            </p>

          <p>You can always edit these settings with the <Icon style="width:20px; color:black; vertical-align: bottom;" path={mdiCog}></Icon> button in the upper right when you have a convo selected. </p>
          <p>Any convos that you have archived will appear under the <Icon style="width:20px; color:black; vertical-align: bottom;" path={mdiArchiveArrowUp}></Icon> button, and you can un-archive them by selecting them from the list.</p>
        </div>
      {/if}

      {#if $activeConvoIndex !== undefined}
          <div transition:fade>
          <ConvoPane on:requestChange={(event) => {tsStore.convoList.requestConvoChanges($activeConvoIndex,event.detail)}}/>
          </div>
      {/if}
    </div>
    {:else}
      <div class="loading"><div class="loader"></div></div>
    {/if}
  </div>
</MaterialApp>

<style>
  .app {
    margin: 0;
    padding-bottom: 10px;
    background-color: lightgray;
    height: 100vh;
  }
  .welcome-text {
    border-radius: 5px;
    border: 1px solid #222;
    margin: auto;
    margin-top: 50px;
    max-width: 650px;
    padding: 26px;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
    background-color: white;
  }

  @media (min-width: 640px) {
    .app {
      max-width: none;
    }
  }
  .loading {
    text-align: center;
    padding-top: 100px;
  }
  .loader {
    border: 8px solid #f3f3f3;
    border-radius: 50%;
    border-top: 8px solid #3498db;
    width: 50px;
    height: 50px;
    -webkit-animation: spin 2s linear infinite; /* Safari */
    animation: spin 2s linear infinite;
    display: inline-block;
  }
  @-webkit-keyframes spin {
    0% { -webkit-transform: rotate(0deg); }
    100% { -webkit-transform: rotate(360deg); }
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .transition-container {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 1fr;
  }

  .transition-container > * {
    grid-row: 1;
    grid-column: 1;
  }
</style>
